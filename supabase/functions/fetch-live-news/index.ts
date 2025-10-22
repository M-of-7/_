// @ts-ignore: Deno is a global object in Supabase Edge Functions
import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore: DOMParser is available in the Supabase Edge Function environment via linkedom
import { DOMParser } from 'npm:linkedom@0.18.4';
// @ts-ignore: Import Gemini AI
import { GoogleGenAI, Modality } from 'npm:@google/genai@^1.26.0';
// @ts-ignore
import { decode } from 'npm:@std/encoding/base64';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RSSFeed {
  url: string;
  name: string;
  language: 'ar' | 'en';
  category: string;
}

const RSS_FEEDS: RSSFeed[] = [
  // ARABIC
  { url: 'https://www.aljazeera.net/xml/rss/all.xml', name: 'الجزيرة', language: 'ar', category: 'world' },
  { url: 'https://www.alarabiya.net/ar/rss.xml', name: 'العربية', language: 'ar', category: 'world' },
  { url: 'https://www.skynewsarabia.com/rss', name: 'سكاي نيوز عربية', language: 'ar', category: 'world' },
  { url: 'https://aawsat.com/rss', name: 'الشرق الأوسط', language: 'ar', category: 'world' },
  { url: 'https://arabic.cnn.com/api/v1/rss/rss.xml', name: 'CNN عربية', language: 'ar', category: 'world' },
  { url: 'https://www.france24.com/ar/rss', name: 'فرانس 24', language: 'ar', category: 'world' },
  { url: 'https://www.aljazeera.net/xml/rss/technology.xml', name: 'الجزيرة تكنولوجيا', language: 'ar', category: 'technology' },
  { url: 'https://www.alarabiya.net/ar/technology/rss.xml', name: 'العربية تقنية', language: 'ar', category: 'technology' },
  { url: 'https://www.aljazeera.net/xml/rss/economy.xml', name: 'الجزيرة اقتصاد', language: 'ar', category: 'business' },
  { url: 'https://www.alarabiya.net/ar/aswaq/rss.xml', name: 'العربية أسواق', language: 'ar', category: 'business' },
  { url: 'https://www.aljazeera.net/xml/rss/sports.xml', name: 'الجزيرة رياضة', language: 'ar', category: 'sports' },
  { url: 'https://www.alarabiya.net/ar/sports/rss.xml', name: 'العربية رياضة', language: 'ar', category: 'sports' },
  { url: 'https://www.aljazeera.net/xml/rss/politics.xml', name: 'الجزيرة سياسة', language: 'ar', category: 'politics' },
  { url: 'https://www.aljazeera.net/xml/rss/arts.xml', name: 'الجزيرة فن', language: 'ar', category: 'entertainment' },
  { url: 'https://www.sayidaty.net/rss.xml', name: 'سيدتي', language: 'ar', category: 'entertainment' },
  { url: 'https://www.filfan.com/rss/articles', name: 'في الفن', language: 'ar', category: 'entertainment' },
  { url: 'https://www.okaz.com.sa/rss', name: 'عكاظ', language: 'ar', category: 'local' },
  { url: 'https://www.alriyadh.com/rss', name: 'جريدة الرياض', language: 'ar', category: 'local' },
  { url: 'https://www.youm7.com/rss/Section/65/1', name: 'اليوم السابع - أخبار مصر', language: 'ar', category: 'local' },

  // ENGLISH
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC News', language: 'en', category: 'world' },
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters', language: 'en', category: 'world' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times', language: 'en', category: 'world' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian', language: 'en', category: 'world' },
  { url: 'http://rss.cnn.com/rss/edition_world.rss', name: 'CNN', language: 'en', category: 'world' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera English', language: 'en', category: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', language: 'en', category: 'technology' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', language: 'en', category: 'technology' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', language: 'en', category: 'technology' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', language: 'en', category: 'technology' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', language: 'en', category: 'business' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', language: 'en', category: 'business' },
  { url: 'https://www.wsj.com/xml/rss/3_7014.xml', name: 'Wall Street Journal', language: 'en', category: 'business' },
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport', language: 'en', category: 'sports' },
  { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', language: 'en', category: 'sports' },
  { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports', language: 'en', category: 'sports' },
  { url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', name: 'BBC Politics', language: 'en', category: 'politics' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', name: 'NY Times Politics', language: 'en', category: 'politics' },
  { url: 'https://www.politico.com/rss/politicopicks.xml', name: 'Politico', language: 'en', category: 'politics' },
  { url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', name: 'BBC Entertainment', language: 'en', category: 'entertainment' },
  { url: 'https://variety.com/feed/', name: 'Variety', language: 'en', category: 'entertainment' },
  { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter', language: 'en', category: 'entertainment' },
  { url: 'https://feeds.reuters.com/reuters/entertainment', name: 'Reuters Entertainment', language: 'en', category: 'entertainment' },
  { url: 'https://feeds.bbci.co.uk/news/england/rss.xml', name: 'BBC News - England', language: 'en', category: 'local' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', name: 'NY Times - U.S.', language: 'en', category: 'local' },
  { url: 'https://feeds.reuters.com/Reuters/domesticNews', name: 'Reuters - U.S.', language: 'en', category: 'local' },
];


async function parseRSS(feed: RSSFeed): Promise<any[]> {
  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
    });
    if (!response.ok) {
        console.error(`Failed to fetch RSS from ${feed.name}: ${response.status} ${response.statusText}`);
        return [];
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc: any = parser.parseFromString(text, 'text/xml');

    const items = doc.querySelectorAll('item');
    const articles: any[] = [];
    
    for (const item of Array.from(items as NodeListOf<Element>).slice(0, 5)) { // Limit to 5 per feed to increase diversity
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const body = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

      if (title && link) {
        articles.push({
          title: title,
          description: body.replace(/<[^>]*>/g, '').substring(0, 500).trim(),
          url: link.trim(),
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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Key not configured.');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // @ts-ignore
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('CRITICAL: Missing GEMINI_API_KEY secret.');
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY secret in project settings.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // FIX: Read parameters from the POST body, as sent by `supabase.functions.invoke`.
    const { language, category } = await req.json();
    const requestedCategory = category || 'all';
    const requestedLanguage = (language || 'en') as 'ar' | 'en';

    let feedsToFetch = RSS_FEEDS.filter(f => f.language === requestedLanguage);
    if (requestedCategory !== 'all') {
      feedsToFetch = feedsToFetch.filter(f => f.category === requestedCategory);
    }

    const allArticlesRaw: any[] = (await Promise.all(feedsToFetch.map(parseRSS))).flat();
    
    // FIX: Deduplicate articles from different feeds based on their URL before processing.
    // This prevents the same story from appearing multiple times.
    const uniqueArticles = new Map<string, any>();
    for (const article of allArticlesRaw) {
      if (article.url && !uniqueArticles.has(article.url)) {
        uniqueArticles.set(article.url, article);
      }
    }
    const allArticles = Array.from(uniqueArticles.values());
    const insertedArticles = [];

    let query = supabase
      .from('news_articles')
      .select('title')
      .eq('language', requestedLanguage)
      .order('published_at', { ascending: false })
      .limit(50);

    if (requestedCategory !== 'all') {
      query = query.eq('category', requestedCategory);
    }
    
    const { data: recentTitles } = await query;
    const existingTitles = recentTitles?.map(t => t.title) || [];

    for (const article of allArticles) {
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('source_url', article.url)
        .maybeSingle();

      if (existing) continue;

      try {
        const isDuplicateResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Is the NEW HEADLINE substantially reporting the same event as any of the EXISTING HEADLINES? Respond with only "Yes" or "No".\n\nEXISTING HEADLINES:\n- ${existingTitles.join('\n- ')}\n\nNEW HEADLINE:\n"${article.title}"`
        });
        if (isDuplicateResponse.text.trim().toLowerCase().includes('yes')) {
            console.log(`Skipping duplicate article: ${article.title}`);
            continue;
        }
      } catch (e) {
          console.error(`Gemini deduplication check failed for "${article.title}":`, e.message);
      }
      
      let imageUrl = 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg'; // Default fallback
      try {
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Generate a high-quality, photorealistic news image representing this headline. The image should be dramatic, cinematic, and contain no text, logos, or watermarks. Headline: "${article.title}"` }] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const part = imageResponse.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64Data = part.inlineData.data;
            const decodedData = decode(base64Data);
            const filePath = `public/${requestedLanguage}/${crypto.randomUUID()}.png`;
            
            const { error: uploadError } = await supabase.storage.from('article_images').upload(filePath, decodedData, { contentType: 'image/png', upsert: true });

            if (uploadError) {
                console.error('Supabase Storage upload error:', uploadError.message);
            } else {
                const { data: publicUrlData } = supabase.storage.from('article_images').getPublicUrl(filePath);
                if (publicUrlData?.publicUrl) {
                    imageUrl = publicUrlData.publicUrl;
                }
            }
        }
      } catch (e) {
          console.error(`Gemini image generation failed for "${article.title}":`, e.message);
      }

      const { data, error } = await supabase
        .from('news_articles')
        .insert({
          title: article.title,
          description: article.description,
          content: article.description,
          source_name: article.source,
          source_url: article.url,
          image_url: imageUrl,
          category: article.category,
          language: article.language,
          published_at: article.publishedAt,
          author: article.source,
          virality_description: 'Medium', // Virality check removed for performance, can be re-added
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error.message);
      } else if (data) {
        insertedArticles.push(data);
        existingTitles.unshift(data.title); // Add to local list to avoid duplicates in the same run
      }
    }

    return new Response(JSON.stringify({ success: true, inserted: insertedArticles.length, total: allArticles.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Main function error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});