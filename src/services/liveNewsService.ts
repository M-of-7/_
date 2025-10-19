import { createClient } from '@supabase/supabase-js';
import type { Article } from '../types';

const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
const supabaseKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const isLiveNewsEnabled = !!supabase;

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  source_name: string;
  source_url: string;
  image_url: string;
  category: string;
  language: string;
  published_at: string;
  author: string;
  created_at: string;
}

function convertToArticle(news: NewsArticle): Article {
  return {
    id: news.id,
    headline: news.title,
    byline: news.author || news.source_name,
    date: news.published_at,
    body: news.content || news.description,
    imageUrl: news.image_url || 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg',
    imagePrompt: '',
    category: news.category as any,
    viralityDescription: 'Live News',
    comments: [],
    sources: [{ title: news.source_name, uri: news.source_url }],
  };
}

export async function fetchLiveNews(
  language: 'ar' | 'en',
  category?: string
): Promise<Article[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    let query = supabase
      .from('news_articles')
      .select('*')
      .eq('language', language)
      .order('published_at', { ascending: false })
      .limit(20);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(convertToArticle);
  } catch (error) {
    console.error('Error fetching live news:', error);
    throw error;
  }
}

export async function refreshLiveNews(
  language: 'ar' | 'en',
  category: string = 'general'
): Promise<void> {
  if (!supabaseUrl) {
    throw new Error('Supabase not configured');
  }

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/fetch-live-news`;

    const response = await fetch(
      `${functionUrl}?language=${language}&category=${category}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh news');
    }

    const result = await response.json();
    console.log(`Refreshed news: ${result.inserted} new articles`);
  } catch (error) {
    console.error('Error refreshing live news:', error);
    throw error;
  }
}

export function subscribeLiveNews(
  language: 'ar' | 'en',
  onNewArticle: (article: Article) => void
) {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('news_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'news_articles',
        filter: `language=eq.${language}`,
      },
      (payload) => {
        const newArticle = convertToArticle(payload.new as NewsArticle);
        onNewArticle(newArticle);
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
