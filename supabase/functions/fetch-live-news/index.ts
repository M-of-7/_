import { createClient } from 'npm:@supabase/supabase-js@2';
import { DOMParser } from 'npm:linkedom@0.18.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  source: { name: string };
  url: string;
  urlToImage: string;
  publishedAt: string;
  author: string;
}

interface RSSFeed {
  url: string;
  name: string;
  language: 'ar' | 'en';
  category: string;
}

const RSS_FEEDS: RSSFeed[] = [
  // Arabic News
  { url: 'https://www.aljazeera.net/xml/rss/all.xml', name: 'الجزيرة', language: 'ar', category: 'world' },
  { url: 'https://www.alarabiya.net/ar/rss.xml', name: 'العربية', language: 'ar', category: 'world' },
  { url: 'https://www.bbc.com/arabic/index.xml', name: 'BBC عربي', language: 'ar', category: 'world' },
  { url: 'https://www.skynewsarabia.com/rss', name: 'سكاي نيوز عربية', language: 'ar', category: 'world' },

  // English News
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC News', language: 'en', category: 'world' },
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters', language: 'en', category: 'world' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times', language: 'en', category: 'world' },
  { url: 'https://feeds.washingtonpost.com/rss/world', name: 'Washington Post', language: 'en', category: 'world' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian', language: 'en', category: 'world' },

  // Technology
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', language: 'en', category: 'technology' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NY Times Tech', language: 'en', category: 'technology' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', language: 'en', category: 'technology' },

  // Business
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', language: 'en', category: 'business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NY Times Business', language: 'en', category: 'business' },

  // Sports
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport', language: 'en', category: 'sports' },
  { url: 'https://www.aljazeera.net/xml/rss/sports.xml', name: 'الجزيرة رياضة', language: 'ar', category: 'sports' },
];

async function parseRSS(feed: RSSFeed): Promise<any[]> {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');

    const items = doc.querySelectorAll('item');
    const articles: any[] = [];

    for (const item of Array.from(items).slice(0, 10)) {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

      let imageUrl = '';
      const mediaContent = item.querySelector('media\\:content, content');
      const enclosure = item.querySelector('enclosure');

      if (mediaContent) {
        imageUrl = mediaContent.getAttribute('url') || '';
      } else if (enclosure) {
        imageUrl = enclosure.getAttribute('url') || '';
      }

      if (title && link) {
        articles.push({
          title: title.trim(),
          description: description.replace(/<[^>]*>/g, '').trim(),
          url: link.trim(),
          imageUrl,
          publishedAt: new Date(pubDate).toISOString(),
          source: feed.name,
          category: feed.category,
          language: feed.language,
        });
      }
    }

    return articles;
  } catch (error) {
    console.error(`Failed to parse RSS from ${feed.name}:`, error);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const requestedCategory = url.searchParams.get('category') || 'all';
    const requestedLanguage = (url.searchParams.get('language') || 'en') as 'ar' | 'en';

    let feedsToFetch = RSS_FEEDS;

    if (requestedLanguage) {
      feedsToFetch = feedsToFetch.filter(f => f.language === requestedLanguage);
    }

    if (requestedCategory && requestedCategory !== 'all') {
      feedsToFetch = feedsToFetch.filter(f => f.category === requestedCategory);
    }

    const allArticles: any[] = [];

    for (const feed of feedsToFetch) {
      const articles = await parseRSS(feed);
      allArticles.push(...articles);
    }

    const insertedArticles = [];

    for (const article of allArticles) {
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('source_url', article.url)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from('news_articles')
          .insert({
            title: article.title,
            description: article.description,
            content: article.description,
            source_name: article.source,
            source_url: article.url,
            image_url: article.imageUrl || 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg',
            category: article.category,
            language: article.language,
            published_at: article.publishedAt,
            author: article.source,
          })
          .select()
          .single();

        if (data) {
          insertedArticles.push(data);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedArticles.length,
        total: allArticles.length,
        articles: insertedArticles,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});