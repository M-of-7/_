import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
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

const getDayLabel = (date: Date, language: Language) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0,0,0,0);

    if (dateOnly.getTime() === today.getTime()) {
        return language === 'ar' ? 'اليوم' : 'Today';
    }
    if (dateOnly.getTime() === yesterday.getTime()) {
        return language === 'ar' ? 'الأمس' : 'Yesterday';
    }
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
};

// Concurrency settings for performance tuning
const MAX_CONCURRENT_DETAIL_JOBS = 4; // Fetch text content faster
const MAX_CONCURRENT_IMAGE_JOBS = 2; // Generate images in the background without overwhelming the API

/**
 * Fetches articles for a given day, utilizing Firestore as a cache.
 * If articles aren't in the cache, it generates headlines, creates shell articles,
 * and saves them to the cache before returning them.
 */
const fetchArticlesForDay = async (date: Date, language: Language): Promise<Article[]> => {
    const dateStr = date.toISOString().split('T')[0];

    // 1. Check cache for existing articles (shell or full)
    const cachedArticles = await firestoreService.getArticlesForDay(dateStr, language);
    if (cachedArticles && cachedArticles.length > 0) {
        return cachedArticles;
    }

    // 2. Cache miss: generate new headlines from Gemini
    const unprocessedHeadlines = await generateHeadlinesForDay(date, language);

    // 3. Create shell articles from the new headlines
    const shellArticles: Article[] = unprocessedHeadlines.map(h => ({
        id: generateArticleId(date.toISOString(), h.headline),
        headline: h.headline,
        category: h.category,
        imagePrompt: h.imagePrompt,
        date: date.toISOString(),
        dayLabel: getDayLabel(date, language),
        imageUrl: '',
        comments: [],
    }));

    // 4. Save shell articles to Firestore cache to prevent re-generation on refresh.
    // This is done asynchronously and not awaited to return faster to the UI.
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
        updateArticle,
        updateMultipleArticles,
        setInitialTodayHeadlines,
        setIsNewEditionAvailable,
        initialTodayHeadlines,
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

    // Query for today's articles. It will now fetch from cache or generate.
    const { data: todayArticlesData, isLoading: isLoadingToday, isError: isErrorToday, error: todayError } = useQuery({
        queryKey: ['articles', today.toISOString().split('T')[0], language],
        queryFn: () => fetchArticlesForDay(today, language),
        enabled: appStatus === 'ready',
        refetchInterval: 5 * 60 * 1000,
    });
    const todayArticles = todayArticlesData || [];
    
    // Logic to detect if a new edition is available by comparing headlines
    useEffect(() => {
        if (todayArticles.length > 0 && initialTodayHeadlines.length > 0) {
            const latestHeadlines = new Set(todayArticles.map(a => a.headline));
            const currentHeadlines = new Set(initialTodayHeadlines);
             if (latestHeadlines.size > 0 && (latestHeadlines.size !== currentHeadlines.size || ![...latestHeadlines].every(h => currentHeadlines.has(h)))) {
                setIsNewEditionAvailable(true);
            }
        }
    }, [todayArticles, initialTodayHeadlines, setIsNewEditionAvailable]);

    // Infinite query for older articles, also using the caching mechanism
    const {
        data: olderArticlesPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingOlder,
        isError: isErrorOlder,
        error: olderError
    } = useInfiniteQuery({
        queryKey: ['articles', 'older', language],
        queryFn: ({ pageParam }) => {
            const date = new Date(today);
            date.setDate(today.getDate() - pageParam);
            return fetchArticlesForDay(date, language);
        },
        initialPageParam: 1,
        getNextPageParam: (_, allPages) => {
            const nextPage = allPages.length + 1;
            return nextPage < 7 ? nextPage : undefined;
        },
        enabled: appStatus === 'ready',
    });

    // Effect to consolidate all fetched articles (from cache or new) into the Zustand store
    useEffect(() => {
        const olderArticlesFlat = olderArticlesPages?.pages.flat() || [];
        const allFetchedArticles = [...todayArticles, ...olderArticlesFlat].filter(Boolean);
        
        if (allFetchedArticles.length > 0) {
            const articlesMap = new Map<string, Article>(articles.map(a => [a.id, a]));
            allFetchedArticles.forEach(fetchedArticle => {
                const existing = articlesMap.get(fetchedArticle.id);
                // Merge fetched data with any existing data, prioritizing existing full data over fetched shells.
                articlesMap.set(fetchedArticle.id, { ...fetchedArticle, ...existing });
            });

            const newArticleList = Array.from(articlesMap.values());
            updateMultipleArticles(newArticleList);

            if (initialTodayHeadlines.length === 0 && todayArticles.length > 0) {
                setInitialTodayHeadlines(todayArticles.map(a => a.headline));
            }
        }

    }, [todayArticles, olderArticlesPages, updateMultipleArticles]);


    // Effect to process shell articles (fetching details only)
    useEffect(() => {
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
                    const details = await generateArticleDetails(article.headline, language);
                    const updatedArticle = { ...article, ...details };
                    updateArticle(updatedArticle); // Update UI with details
                    firestoreService.syncArticle(updatedArticle); // Sync partial update to cache
                } catch (err) {
                    console.error(`Failed to fetch details for article ${article.id}`, err);
                    processingDetailIds.current.delete(article.id); // Allow reprocessing on error
                } finally {
                    setInFlightDetailJobs(current => Math.max(0, current - 1));
                }
            };

            processDetails();
        });
    }, [articles, language, updateArticle, inFlightDetailJobs]);

    // Effect to process articles with details but needing images
    useEffect(() => {
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
                    const updatedArticle = { ...article, imageUrl };
                    updateArticle(updatedArticle); // Final update with the image
                    firestoreService.syncArticle(updatedArticle); // Sync final article to cache
                } catch (err) {
                    console.error(`Failed to generate image for article ${article.id}`, err);
                    processingImageIds.current.delete(article.id); // Allow reprocessing on error
                } finally {
                    setInFlightImageJobs(current => Math.max(0, current - 1));
                }
            };
            
            processImage();
        });
    }, [articles, language, updateArticle, inFlightImageJobs]);
    
    const refresh = () => {
        setIsNewEditionAvailable(false);
        processingDetailIds.current.clear();
        processingImageIds.current.clear();
        setInFlightDetailJobs(0);
        setInFlightImageJobs(0);
        setInitialTodayHeadlines([]);
        // Invalidate the new 'articles' query key to force a full refresh
        queryClient.invalidateQueries({ queryKey: ['articles'] });
    };

    const isLoading = (isLoadingToday || isLoadingOlder) && articles.length === 0;
    const isError = isErrorToday || isErrorOlder;
    const error = todayError || olderError;

    return { isLoading, isError, error, isFetchingNextPage, fetchNextPage, hasNextPage, refresh };
};
