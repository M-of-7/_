// @ts-ignore: Deno is a global object in Supabase Edge Functions
import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore: DOMParser is available in the Supabase Edge Function environment via linkedom
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
  // ARABIC WORLD NEWS
  { url: 'https://www.aljazeera.net/xml/rss/all.xml', name: 'الجزيرة', language: 'ar', category: 'world' },
  { url: 'https://www.alarabiya.net/ar/rss.xml', name: 'العربية', language: 'ar', category: 'world' },
  { url: 'https://www.bbc.com/arabic/index.xml', name: 'BBC عربي', language: 'ar', category: 'world' },
  { url: 'https://www.skynewsarabia.com/rss', name: 'سكاي نيوز عربية', language: 'ar', category: 'world' },
  { url: 'https://www.france24.com/ar/rss', name: 'فرانس 24', language: 'ar', category: 'world' },
  { url: 'https://arabic.cnn.com/api/v1/rss/rss.xml', name: 'CNN عربية', language: 'ar', category: 'world' },
  { url: 'https://aawsat.com/rss', name: 'الشرق الأوسط', language: 'ar', category: 'world' },

  // ENGLISH WORLD NEWS
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC News', language: 'en', category: 'world' },
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters', language: 'en', category: 'world' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times', language: 'en', category: 'world' },
  { url: 'https://feeds.washingtonpost.com/rss/world', name: 'Washington Post', language: 'en', category: 'world' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian', language: 'en', category: 'world' },
  { url: 'http://rss.cnn.com/rss/edition_world.rss', name: 'CNN', language: 'en', category: 'world' },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/world', name: 'NBC News', language: 'en', category: 'world' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera English', language: 'en', category: 'world' },

  // TECHNOLOGY (ARABIC)
  { url: 'https://www.aljazeera.net/xml/rss/technology.xml', name: 'الجزيرة تكنولوجيا', language: 'ar', category: 'technology' },
  { url: 'https://www.alarabiya.net/ar/technology/rss.xml', name: 'العربية تقنية', language: 'ar', category: 'technology' },

  // TECHNOLOGY (ENGLISH)
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', language: 'en', category: 'technology' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NY Times Tech', language: 'en', category: 'technology' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', language: 'en', category: 'technology' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', language: 'en', category: 'technology' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', language: 'en', category: 'technology' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', language: 'en', category: 'technology' },

  // BUSINESS (ARABIC)
  { url: 'https://www.aljazeera.net/xml/rss/economy.xml', name: 'الجزيرة اقتصاد', language: 'ar', category: 'business' },
  { url: 'https://www.alarabiya.net/ar/aswaq/rss.xml', name: 'العربية أسواق', language: 'ar', category: 'business' },
  { url: 'https://www.bbc.com/arabic/business/index.xml', name: 'BBC عربي أعمال', language: 'ar', category: 'business' },

  // BUSINESS (ENGLISH)
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', language: 'en', category: 'business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', name: 'NY Times Business', language: 'en', category: 'business' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', language: 'en', category: 'business' },
  { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', language: 'en', category: 'business' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC', language: 'en', category: 'business' },

  // SPORTS (ARABIC)
  { url: 'https://www.aljazeera.net/xml/rss/sports.xml', name: 'الجزيرة رياضة', language: 'ar', category: 'sports' },
  { url: 'https://www.alarabiya.net/ar/sports/rss.xml', name: 'العربية رياضة', language: 'ar', category: 'sports' },
  { url: 'https://www.bbc.com/arabic/sports/index.xml', name: 'BBC عربي رياضة', language: 'ar', category: 'sports' },

  // SPORTS (ENGLISH)
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport', language: 'en', category: 'sports' },
  { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', language: 'en', category: 'sports' },
  { url: 'http://rss.cnn.com/rss/edition_sport.rss', name: 'CNN Sport', language: 'en', category: 'sports' },
  { url: 'https://www.theguardian.com/sport/rss', name: 'Guardian Sport', language: 'en', category: 'sports' },

  // POLITICS (ARABIC)
  { url: 'https://www.aljazeera.net/xml/rss/politics.xml', name: 'الجزيرة سياسة', language: 'ar', category: 'politics' },
  { url: 'https://www.bbc.com/arabic/middleeast/index.xml', name: 'BBC عربي شرق أوسط', language: 'ar', category: 'politics' },

  // POLITICS (ENGLISH)
  { url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', name: 'BBC Politics', language: 'en', category: 'politics' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', name: 'NY Times Politics', language: 'en', category: 'politics' },
  { url: 'https://www.theguardian.com/politics/rss', name: 'Guardian Politics', language: 'en', category: 'politics' },
  { url: 'http://rss.cnn.com/rss/edition_politics.rss', name: 'CNN Politics', language: 'en', category: 'politics' },

  // HEALTH (ARABIC)
  { url: 'https://www.bbc.com/arabic/science/index.xml', name: 'BBC عربي علوم وصحة', language: 'ar', category: 'local' },

  // HEALTH (ENGLISH)
  { url: 'https://feeds.bbci.co.uk/news/health/rss.xml', name: 'BBC Health', language: 'en', category: 'local' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', name: 'NY Times Health', language: 'en', category: 'local' },
  { url: 'https://www.theguardian.com/society/health/rss', name: 'Guardian Health', language: 'en', category: 'local' },
];

async function translateText(text: string, targetLang: 'ar' | 'en'): Promise<string> {
  try {
    // @ts-ignore
    const apiKey = Deno.env.get('VITE_API_KEY');
    if (!apiKey) return text;

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text',
        }),
      }
    );

    const data = await response.json();
    return data?.data?.translations?.[0]?.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

async function parseRSS(feed: RSSFeed): Promise<any[]> {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    const text = await response.text();
    const parser = new DOMParser();
    const doc: any = parser.parseFromString(text, 'text/xml');

    const items = doc.querySelectorAll('item');
    const articles: any[] = [];
    
    for (const item of Array.from(items as NodeListOf<Element>).slice(0, 10)) {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      
      let body = item.querySelector('description')?.textContent || '';
      const contentEncoded = item.querySelector('content\\:encoded')?.textContent;
      if (contentEncoded && contentEncoded.length > body.length) {
        body = contentEncoded;
      }
      
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

      // Fallback to find image in content
      if (!imageUrl && body) {
          const match = body.match(/<img[^>]+src="([^">]+)"/);
          if (match && match[1]) {
              imageUrl = match[1];
          }
      }

      if (title && link) {
        articles.push({
          title: title,
          description: body.replace(/<[^>]*>/g, '').trim(),
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

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const requestedCategory = url.searchParams.get('category') || 'all';
    const requestedLanguage = (url.searchParams.get('language') || 'en') as 'ar' | 'en';
    const shouldTranslate = url.searchParams.get('translate') === 'true';

    let feedsToFetch = RSS_FEEDS.filter(f => f.language === requestedLanguage);

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
        let finalTitle = article.title;
        let finalDescription = article.description;

        if (shouldTranslate && article.language !== requestedLanguage) {
          finalTitle = await translateText(article.title, requestedLanguage);
          finalDescription = await translateText(article.description, requestedLanguage);
        }

        const { data, error } = await supabase
          .from('news_articles')
          .insert({
            title: finalTitle,
            description: finalDescription,
            content: finalDescription,
            source_name: article.source,
            source_url: article.url,
            image_url: article.imageUrl || 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg',
            category: article.category,
            language: shouldTranslate ? requestedLanguage : article.language,
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