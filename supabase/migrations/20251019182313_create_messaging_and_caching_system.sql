/*
  # نظام الرسائل والتخزين المؤقت / Messaging and Caching System

  ## الجداول الجديدة / New Tables
  
  ### 1. `profiles` - ملفات المستخدمين
    - `id` (uuid, primary key) - معرف المستخدم
    - `username` (text, unique) - اسم المستخدم
    - `display_name` (text) - الاسم المعروض
    - `avatar_url` (text) - رابط الصورة الشخصية
    - `bio` (text) - النبذة الشخصية
    - `created_at` (timestamptz) - تاريخ الإنشاء
    - `updated_at` (timestamptz) - تاريخ آخر تحديث

  ### 2. `friendships` - الصداقات
    - `id` (uuid, primary key) - معرف العلاقة
    - `user_id` (uuid) - المستخدم الأول
    - `friend_id` (uuid) - المستخدم الثاني
    - `status` (text) - حالة الطلب (pending, accepted, rejected)
    - `created_at` (timestamptz) - تاريخ الإنشاء

  ### 3. `messages` - الرسائل
    - `id` (uuid, primary key) - معرف الرسالة
    - `sender_id` (uuid) - معرف المرسل
    - `receiver_id` (uuid) - معرف المستقبل
    - `content` (text) - محتوى الرسالة
    - `article_id` (text, nullable) - معرف المقال (إن وجد)
    - `is_read` (boolean) - هل تمت القراءة
    - `created_at` (timestamptz) - تاريخ الإرسال

  ### 4. `cached_articles` - المقالات المخزنة
    - `id` (text, primary key) - معرف المقال
    - `headline` (text) - العنوان
    - `category` (text) - التصنيف
    - `body` (text) - المحتوى
    - `byline` (text) - اسم الكاتب
    - `image_url` (text) - رابط الصورة
    - `image_prompt` (text) - وصف الصورة
    - `language` (text) - اللغة
    - `date` (text) - التاريخ
    - `virality_description` (text) - وصف الانتشار
    - `sources` (jsonb) - المصادر
    - `created_at` (timestamptz) - تاريخ الإنشاء
    - `updated_at` (timestamptz) - تاريخ التحديث

  ## الأمان / Security
    - تفعيل RLS على جميع الجداول
    - سياسات وصول محددة لكل جدول
*/

-- إنشاء جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- إنشاء جدول الصداقات
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendship status"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = friend_id AND status = 'pending')
  WITH CHECK (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  article_id text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- إنشاء جدول المقالات المخزنة
CREATE TABLE IF NOT EXISTS cached_articles (
  id text PRIMARY KEY,
  headline text NOT NULL,
  category text NOT NULL,
  body text DEFAULT '',
  byline text DEFAULT '',
  image_url text DEFAULT '',
  image_prompt text DEFAULT '',
  language text NOT NULL,
  date text NOT NULL,
  virality_description text DEFAULT '',
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cached_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cached articles"
  ON cached_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert articles"
  ON cached_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update articles"
  ON cached_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_articles_date ON cached_articles(date);
CREATE INDEX IF NOT EXISTS idx_cached_articles_language ON cached_articles(language);
CREATE INDEX IF NOT EXISTS idx_cached_articles_category ON cached_articles(category);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cached_articles_updated_at BEFORE UPDATE ON cached_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
