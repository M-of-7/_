import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppStore } from '../store/store';
import type { Article, Language } from '../types';
import { fetchLiveNews, subscribeLiveNews, isLiveNewsEnabled, refreshLiveNews } from '../services/liveNewsService';
import { MOCK_ARTICLES } from '../services/mockData';

const fetchArticles = async (language: Language, topic: string): Promise<Article[]> => {
  if (!isLiveNewsEnabled) {
    // Fast mode: return mock data directly
    console.log("Live news disabled, returning mock data.");
    const mockArticles = MOCK_ARTICLES[language] || [];
    if (topic === 'all') {
      return mockArticles;
    }
    return mockArticles.filter((a) => a.category.toLowerCase() === topic.toLowerCase());
  }

  // Live mode: fetch from Supabase. No fallback to mock data on error to ensure data is always live.
  try {
    const articles = await fetchLiveNews(language, topic === 'all' ? undefined : topic);

    if (articles.length === 0) {
      console.log('No live news found for this topic, attempting to refresh from source...');
      await refreshLiveNews(language, topic);
      // Re-fetch after attempting to refresh to get the new data.
      return await fetchLiveNews(language, topic === 'all' ? undefined : topic);
    }

    return articles;
  } catch (error) {
    console.error('CRITICAL: Error fetching live news. The application will show an error state.', error);
    // Re-throw the error to be caught by React Query's `isError` state.
    // This PREVENTS falling back to stale mock data.
    throw error;
  }
};

export const useLiveNews = () => {
  const { language, activeTopic } = useAppStore();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['live-news', language, activeTopic],
    queryFn: () => fetchArticles(language, activeTopic),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    retry: 1, // Retry only once on failure before showing an error
  });

  useEffect(() => {
    if (!isLiveNewsEnabled) return;

    const unsubscribe = subscribeLiveNews(language, (newArticle) => {
      console.log('New article received:', newArticle.headline);

      if (activeTopic === 'all' || newArticle.category.toLowerCase() === activeTopic.toLowerCase()) {
        queryClient.setQueryData(
          ['live-news', language, activeTopic],
          (old: Article[] = []) => [newArticle, ...old]
        );
      }
    });

    return unsubscribe;
  }, [language, activeTopic, queryClient]);

  const refreshNews = async () => {
    if (!isLiveNewsEnabled) {
      await refetch();
      return;
    }

    try {
      await refreshLiveNews(language, activeTopic);
      await refetch();
    } catch (error) {
      console.error('Error refreshing news:', error);
    }
  };

  return {
    articles,
    isLoading,
    isError,
    refreshNews,
    isLiveMode: isLiveNewsEnabled,
  };
};
