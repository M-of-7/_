/*
  # Fix News Articles RLS Policies

  1. Security Changes
    - Add policy to allow public read access to news_articles
    - News articles are public content and should be readable by everyone
    - No authentication required for reading news

  This allows the app to fetch and display news articles without requiring users to be logged in.
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to news articles" ON news_articles;

-- Create policy for public read access
CREATE POLICY "Allow public read access to news articles"
  ON news_articles
  FOR SELECT
  TO anon, authenticated
  USING (true);
