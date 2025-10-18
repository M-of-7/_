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

// Concurrency settings for performance tuning to avoid rate limiting.
const MAX_CONCURRENT_DETAIL_JOBS = 2; // Was 4
const MAX_CONCURRENT_IMAGE_JOBS = 1; // Was 2

/**
 * Fetches articles for a given day, utilizing Firestore as a cache.
 * If articles aren't in the cache, it generates headlines, creates shell articles,
 * and saves them to the cache before returning them.
 */
const fetchArticlesForDay = async (date: Date, language: Language, topic: string): Promise<Article[]> => {
    const dateStr = date.toISOString().split('T')[0];

    // 1. Check cache for existing articles (shell or full)
    const cachedArticles = await firestoreService.getArticlesForDay(dateStr, language);
    if (cachedArticles && cachedArticles.length > 0) {
        // If a specific topic is requested, filter cached articles.
        // If 'all' is requested, return all articles for that day.
        if (topic !== 'all') {
            const topicArticles = cachedArticles.filter(a => a.category.toLowerCase() === topic.toLowerCase());
            // If we have enough articles for the topic in cache, return them.
            // Otherwise, we might still want to fetch new ones. For simplicity, we return what we have.
            if (topicArticles.length > 0) return topicArticles;
        } else {
             return cachedArticles;
        }
    }

    // 2. Cache miss or insufficient topic articles: generate new headlines from Gemini
    const unprocessedHeadlines = await generateHeadlinesForDay(date, language, topic);

    // 3. Create shell articles from the new headlines
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

    // 4. Save shell articles to Firestore cache to prevent re-generation on refresh.
    if (shellArticles.length > 0) {
        firestoreService.syncArticlesBatch(shellArticles);
    }

    // 5. Return shell articles for immediate display
    return shellArticles;
};


// Custom hook to manage all article-related logic
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

    // State and refs for sequential processing
    const [inFlightDetailJobs, setInFlightDetailJobs] = useState(0);
    const [inFlightImageJobs, setInFlightImageJobs] = useState(0);
    const processingDetailIds = useRef(new Set<string>());
    const processingImageIds = useRef(new Set<string>());
    
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    
    // Infinite query for all articles, starting from today (page 0).
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
        initialPageParam: 0, // Start with today
        getNextPageParam: (lastPage, allPages) => {
            // We fetch up to 30 days of articles
            const nextPage = allPages.length;
            return nextPage < 30 ? nextPage : undefined;
        },
        enabled: appStatus === 'ready',
    });

    // Consolidate all fetched articles into the Zustand store
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

    // Logic to detect if a new edition is available by comparing headlines
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


    // Effect to process shell articles (fetching details only)
    useEffect(() => {
        if (hydrationError) return; // Stop processing if a hydration error occurred

        const articlesNeedingDetails = articles.filter(
            a => !a.body && !processingDetailIds.current.has(a.id)
        );

        if (articlesNeedingDetails.length === 0 || inFlightDetailJobs >= MAX_CONCURRENT_DETAIL_JOBS) {
            return;
        }

        const availableSlots = MAX_CONCURRENT_DETAIL_JOBS - inFlightDetailJobs;
        const articlesToProcess = articlesNeedingDetails.slice(0, availableSlots);

        setInFlightDetailJobs(current => current + articlesToProcess.length);

        articlesToProcess.forEach(article => {
            processingDetailIds.current.add(article.id);

            const processDetails = async () => {
                try {
                    const { details, groundingMetadata } = await generateArticleDetails(article.headline, language);
                    // Populate sources from grounding metadata for accuracy
                    const sources = groundingMetadata?.groundingChunks
                        ?.map(chunk => chunk.web && { title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri })
                        .filter(Boolean) as { title: string; uri: string }[] || [];

                    if (useAppStore.getState().activeTopic === activeTopic) {
                        const updatedArticle = { ...article, ...details, sources };
                        updateArticle(updatedArticle);
                        firestoreService.syncArticle(updatedArticle);
                    }
                } catch (err) {
                    console.error(`Failed to fetch details for article ${article.id}`, err);
                    if (err instanceof Error && (err.message.includes('quota') || err.message.includes('429'))) {
                        setHydrationError(err.message);
                    }
                    processingDetailIds.current.delete(article.id);
                } finally {
                    setInFlightDetailJobs(current => Math.max(0, current - 1));
                }
            };

            processDetails();
        });
    }, [articles, language, updateArticle, inFlightDetailJobs, activeTopic, hydrationError, setHydrationError]);

    // Effect to process articles with details but needing images
    useEffect(() => {
        if (hydrationError) return; // Stop processing if a hydration error occurred

        const articlesNeedingImages = articles.filter(
            a => a.body && a.imagePrompt && a.imageUrl === '' && !processingImageIds.current.has(a.id)
        );

        if (articlesNeedingImages.length === 0 || inFlightImageJobs >= MAX_CONCURRENT_IMAGE_JOBS) {
            return;
        }

        const availableSlots = MAX_CONCURRENT_IMAGE_JOBS - inFlightImageJobs;
        const articlesToProcess = articlesNeedingImages.slice(0, availableSlots);

        setInFlightImageJobs(current => current + articlesToProcess.length);

        articlesToProcess.forEach(article => {
            processingImageIds.current.add(article.id);

            const processImage = async () => {
                try {
                    const imageUrl = await generateArticleImage(article.imagePrompt!);
                    if (useAppStore.getState().activeTopic === activeTopic) {
                        const updatedArticle = { ...article, imageUrl };
                        updateArticle(updatedArticle);
                        firestoreService.syncArticle(updatedArticle);
                    }
                } catch (err) {
                    console.error(`Failed to generate image for article ${article.id}`, err);
                     if (err instanceof Error && (err.message.includes('quota') || err.message.includes('429'))) {
                        setHydrationError(err.message);
                    }
                    processingImageIds.current.delete(article.id);
                } finally {
                    setInFlightImageJobs(current => current - Math.max(0, current - 1));
                }
            };
            
            processImage();
        });
    }, [articles, language, updateArticle, inFlightImageJobs, activeTopic, hydrationError, setHydrationError]);
    
    const refresh = () => {
        setHydrationError(null); // Clear the hydration error on refresh
        setArticles([]);
        setIsNewEditionAvailable(false);
        processingDetailIds.current.clear();
        processingImageIds.current.clear();
        setInFlightDetailJobs(0);
        setInFlightImageJobs(0);
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