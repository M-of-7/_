import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { generateHeadlinesForDay, generateArticleDetails, generateArticleImage } from '../services/geminiService';
import { useAppStore } from '../store/store';
import type { Article, Language } from '../types';
import { firestoreService } from '../services/firestoreService';

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
};


const generateArticleId = (date: string, headline: string): string => {
  const datePart = date.split('T')[0];
  const headlineHash = simpleHash(headline);
  return `${datePart}-${headlineHash}`;
};

// Ensure only one article is being fully processed at a time.
const MAX_CONCURRENT_JOBS = 1;

const fetchArticlesForDay = async (date: Date, language: Language, topic: string): Promise<Article[]> => {
    const dateStr = date.toISOString().split('T')[0];
    const cachedArticles = await firestoreService.getArticlesForDay(dateStr, language);
    if (cachedArticles && cachedArticles.length > 0) {
        if (topic !== 'all') {
            const topicArticles = cachedArticles.filter(a => a.category.toLowerCase() === topic.toLowerCase());
            if (topicArticles.length > 0) return topicArticles;
        } else {
             return cachedArticles;
        }
    }

    const unprocessedHeadlines = await generateHeadlinesForDay(date, language, topic);
    const shellArticles: Article[] = unprocessedHeadlines.map(h => ({
        id: generateArticleId(date.toISOString(), h.headline),
        headline: h.headline,
        category: h.category,
        imagePrompt: h.imagePrompt,
        date: date.toISOString(),
        imageUrl: '',
        comments: [],
        sources: [],
    }));

    if (shellArticles.length > 0) {
        firestoreService.syncArticlesBatch(shellArticles);
    }
    return shellArticles;
};

export const useArticles = () => {
    const { 
        language, 
        appStatus,
        articles, 
        setArticles,
        updateArticle,
        updateMultipleArticles,
        setInitialTodayHeadlines,
        setIsNewEditionAvailable,
        initialTodayHeadlines,
        activeTopic,
        hydrationError,
        setHydrationError,
    } = useAppStore();
    const queryClient = useQueryClient();

    const [inFlightJobs, setInFlightJobs] = useState(0);
    const processingIds = useRef(new Set<string>());
    
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    
    const {
        data: articlePages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteQuery({
        queryKey: ['articles', language, activeTopic],
        queryFn: ({ pageParam }) => {
            const date = new Date(today);
            date.setDate(today.getDate() - pageParam);
            return fetchArticlesForDay(date, language, activeTopic);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            return nextPage < 30 ? nextPage : undefined;
        },
        enabled: appStatus === 'ready',
    });

    useEffect(() => {
        const allFetchedArticles = articlePages?.pages.flat().filter(Boolean) || [];
        if (allFetchedArticles.length > 0) {
            updateMultipleArticles(allFetchedArticles);
            const todayArticles = articlePages?.pages[0] || [];
            if (useAppStore.getState().initialTodayHeadlines.length === 0 && todayArticles.length > 0 && activeTopic === 'all') {
                setInitialTodayHeadlines(todayArticles.map(a => a.headline));
            }
        }
    }, [articlePages, updateMultipleArticles, activeTopic, setInitialTodayHeadlines]);

    useEffect(() => {
        const todayArticles = articlePages?.pages[0] || [];
        if (todayArticles.length > 0 && initialTodayHeadlines.length > 0 && activeTopic === 'all') {
            const latestHeadlines = new Set(todayArticles.map(a => a.headline));
            const currentHeadlines = new Set(initialTodayHeadlines);
             if (latestHeadlines.size > 0 && (latestHeadlines.size !== currentHeadlines.size || ![...latestHeadlines].every(h => currentHeadlines.has(h)))) {
                setIsNewEditionAvailable(true);
            }
        }
    }, [articlePages, initialTodayHeadlines, setIsNewEditionAvailable, activeTopic]);


    // Sequential Hydration Effect
    useEffect(() => {
        const articleToProcess = articles.find(a => 
            (!a.body || (a.imagePrompt && a.imageUrl === '')) && !processingIds.current.has(a.id)
        );

        if (!articleToProcess || inFlightJobs >= MAX_CONCURRENT_JOBS) {
            return;
        }

        processingIds.current.add(articleToProcess.id);
        setInFlightJobs(current => current + 1);

        const processArticleSequentially = async (article: Article) => {
            try {
                let currentArticleState = { ...article };

                // 1. Fetch details if they don't exist
                if (!currentArticleState.body) {
                    const { details, groundingMetadata } = await generateArticleDetails(article.headline, language);
                    const sources = groundingMetadata?.groundingChunks
                        ?.map(chunk => chunk.web && { title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri })
                        .filter(Boolean) as { title: string; uri: string }[] || [];
                    
                    currentArticleState = { ...currentArticleState, ...details, sources };
                    
                    if (useAppStore.getState().activeTopic === activeTopic) {
                        updateArticle(currentArticleState);
                        firestoreService.syncArticle(currentArticleState);
                    }
                }

                // 2. Fetch image if details exist but image doesn't
                if (currentArticleState.body && currentArticleState.imagePrompt && currentArticleState.imageUrl === '') {
                    const imageUrl = await generateArticleImage(currentArticleState.imagePrompt);
                    currentArticleState = { ...currentArticleState, imageUrl };

                    if (useAppStore.getState().activeTopic === activeTopic) {
                        updateArticle(currentArticleState);
                        firestoreService.syncArticle(currentArticleState);
                    }
                }

            } catch (err) {
                console.error(`Failed to fully process article ${article.id}`, err);
                if (err instanceof Error) {
                    setHydrationError(err.message);
                }
            } finally {
                processingIds.current.delete(article.id);
                setInFlightJobs(current => Math.max(0, current - 1));
            }
        };

        processArticleSequentially(articleToProcess);
        
    }, [articles, language, updateArticle, inFlightJobs, activeTopic, hydrationError, setHydrationError]);
    
    const refresh = () => {
        setHydrationError(null);
        setArticles([]);
        setIsNewEditionAvailable(false);
        processingIds.current.clear();
        setInFlightJobs(0);
        setInitialTodayHeadlines([]);
        queryClient.invalidateQueries({ queryKey: ['articles'] });
    };

    return { 
        isLoading: isLoading && articles.length === 0, 
        isError, 
        error, 
        isFetchingNextPage, 
        fetchNextPage, 
        hasNextPage, 
        refresh 
    };
};