import { createClient } from '@supabase/supabase-js';
import type { Article } from '../types';

// Check for documented env vars first, then fall back to older/alternative names for robustness.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;


let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
} else {
  console.log("Live News mode is disabled. Supabase environment variables are not set.");
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
  virality_description: string | null;
}

function convertToArticle(news: NewsArticle): Article {
  return {
    id: news.id,
    headline: news.title,
    byline: news.author || news.source_name,
    date: news.published_at,
    body: news.content || news.description,
    imageUrl: news.image_url, // Images are now AI-generated and reliable
    imagePrompt: '',
    category: news.category as any,
    viralityDescription: news.virality_description || undefined,
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
  category: string = 'all'
): Promise<void> {
  if (!supabaseUrl) {
    throw new Error('Supabase not configured');
  }

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/fetch-live-news`;

    const categoryMap: Record<string, string> = {
      'all': 'world',
      'local': 'local',
      'politics': 'politics',
      'business': 'business',
      'technology': 'technology',
      'sports': 'sports',
      'entertainment': 'entertainment',
    };

    const mappedCategory = categoryMap[category] || 'world';

    const response = await fetch(
      `${functionUrl}?language=${language}&category=${mappedCategory}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', errorText);
      throw new Error('Failed to refresh news');
    }

    const result = await response.json();
    console.log(`Refreshed news: ${result.inserted} new articles inserted out of ${result.total} fetched`);
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