/*
  # Live News System

  1. New Tables
    - `news_articles`
      - `id` (uuid, primary key)
      - `title` (text) - Article headline
      - `description` (text) - Article summary
      - `content` (text) - Full article content
      - `source_name` (text) - News source (Reuters, BBC, etc.)
      - `source_url` (text) - Original article URL
      - `image_url` (text) - Article image
      - `category` (text) - Technology, World, Sports, etc.
      - `language` (text) - 'ar' or 'en'
      - `published_at` (timestamptz) - When article was published
      - `author` (text) - Article author
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `news_articles` table
    - Add policy for public read access (news is public)
    - Add policy for authenticated insert (for admin/system)
    
  3. Indexes
    - Index on published_at for sorting
    - Index on category for filtering
    - Index on language for filtering
*/

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  source_name text NOT NULL,
  source_url text NOT NULL,
  image_url text,
  category text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  published_at timestamptz NOT NULL DEFAULT now(),
  author text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Public can read all news
CREATE POLICY "Anyone can read news articles"
  ON news_articles
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert (for admin/system)
CREATE POLICY "Authenticated users can insert news"
  ON news_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_language ON news_articles(language);
CREATE INDEX IF NOT EXISTS idx_news_category_language ON news_articles(category, language);
