import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppStore } from '../store/store';
import type { Article, Language } from '../types';
import { fetchLiveNews, subscribeLiveNews, isLiveNewsEnabled, refreshLiveNews } from '../services/liveNewsService';
import { MOCK_ARTICLES } from '../services/mockData';

const fetchArticles = async (language: Language, topic: string): Promise<Article[]> => {
  if (!isLiveNewsEnabled) {
    // Fast mode: return mock data directly
    const mockArticles = MOCK_ARTICLES[language] || [];
    if (topic === 'all') {
      return mockArticles;
    }
    return mockArticles.filter((a) => a.category.toLowerCase() === topic.toLowerCase());
  }

  // Live mode: fetch from Supabase and fallback on error
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
    console.error('Error fetching live news, falling back to mock data:', error);
    // Fallback to mock data on error to ensure app remains usable.
    const mockArticles = MOCK_ARTICLES[language] || [];

    if (topic === 'all') {
      return mockArticles;
    }

    return mockArticles.filter((a) =>
      a.category.toLowerCase() === topic.toLowerCase()
    );
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