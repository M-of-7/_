import { createClient } from 'npm:@supabase/supabase-js@2';

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const newsApiKey = Deno.env.get('NEWS_API_KEY');

    if (!newsApiKey) {
      return new Response(
        JSON.stringify({ error: 'NEWS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'general';
    const language = url.searchParams.get('language') || 'en';

    // Map categories to News API categories
    const categoryMap: Record<string, string> = {
      'technology': 'technology',
      'world': 'general',
      'sports': 'sports',
      'business': 'business',
      'politics': 'general',
      'local': 'general',
    };

    const newsCategory = categoryMap[category.toLowerCase()] || 'general';
    const newsLanguage = language === 'ar' ? 'ar' : 'en';

    // Fetch from News API
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${newsCategory}&language=${newsLanguage}&pageSize=20&apiKey=${newsApiKey}`;
    
    const newsResponse = await fetch(newsApiUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== 'ok') {
      throw new Error('Failed to fetch news from API');
    }

    const articles = newsData.articles;
    const insertedArticles = [];

    // Insert new articles into database
    for (const article of articles) {
      // Check if article already exists
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
            description: article.description || '',
            content: article.content || article.description || '',
            source_name: article.source.name,
            source_url: article.url,
            image_url: article.urlToImage || '',
            category: category,
            language: newsLanguage,
            published_at: article.publishedAt,
            author: article.author || article.source.name,
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
        total: articles.length,
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