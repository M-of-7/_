# 📡 إعداد نظام الأخبار الحية

## 🎯 نظرة عامة

تم تطوير نظام أخبار حي يجلب الأخبار مباشرة من وكالات الأنباء العالمية (Reuters, BBC, CNN, etc.) لحظة نشرها!

---

## ✨ الميزات

- 📡 **أخبار حية** - جلب تلقائي من News API
- 🔄 **تحديث تلقائي** - كل دقيقتين
- ⚡ **إشعارات فورية** - عند نشر خبر جديد
- 🗄️ **تخزين في قاعدة البيانات** - Supabase
- 🌍 **دعم لغتين** - عربي وإنجليزي
- 📊 **6 تصنيفات** - Technology, World, Sports, Business, Politics, Local

---

## 🚀 خطوات الإعداد

### 1. إعداد Supabase (مطلوب)

#### أ) إنشاء مشروع Supabase

1. اذهب إلى https://supabase.com
2. سجّل دخول أو أنشئ حساب
3. أنشئ مشروع جديد
4. احفظ:
   - `Project URL`
   - `anon/public key`

#### ب) قاعدة البيانات جاهزة تلقائياً ✅

الجداول تم إنشاؤها تلقائياً عند نشر المشروع:
- `news_articles` - تخزين الأخبار
- Indexes للأداء
- RLS Policies للأمان

### 2. إعداد News API (مطلوب)

#### الحصول على API Key مجاني

1. اذهب إلى https://newsapi.org/register
2. سجّل بإيميلك
3. ستحصل على API Key مجاناً
4. الحد المجاني: **100 طلب/يوم** (كافي جداً!)

**ملاحظة:** النسخة المجانية ممتازة للاستخدام الشخصي والتطوير!

### 3. إضافة المتغيرات البيئية

#### أ) للتطوير المحلي

أنشئ ملف `.env` في جذر المشروع:

```env
# Supabase (مطلوب)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# News API (مطلوب)
NEWS_API_KEY=your_newsapi_key_here

# Firebase (اختياري - للمصادقة)
VITE_FIREBASE_API_KEY=...
```

#### ب) للنشر على Netlify/Vercel

أضف المتغيرات في لوحة التحكم:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
NEWS_API_KEY
```

### 4. تشغيل المشروع

```bash
# تثبيت المكتبات
npm install

# تشغيل محلي
npm run dev

# بناء للإنتاج
npm run build
```

---

## 🎮 كيفية الاستخدام

### عرض الأخبار الحية

- افتح التطبيق
- ستشاهد مؤشر **"أخبار حية"** باللون الأخضر
- الأخبار تُحدّث تلقائياً كل دقيقتين

### تحديث يدوي

- اضغط على زر **"🔄 تحديث"**
- سيجلب أحدث الأخبار فوراً

### التصنيفات

- اختر أي تصنيف (تكنولوجيا، رياضة، سياسة، etc.)
- ستظهر الأخبار المتعلقة بهذا التصنيف فقط

---

## 🔧 كيف يعمل النظام؟

### 1. جلب الأخبار

```
User clicks "Refresh"
    ↓
Edge Function: fetch-live-news
    ↓
News API (newsapi.org)
    ↓
Supabase Database
    ↓
Frontend (Real-time)
```

### 2. التحديث التلقائي

- **كل دقيقتين** - React Query يسأل عن أخبار جديدة
- **Real-time** - Supabase تُشعرك فوراً عند إضافة خبر
- **Background** - يعمل في الخلفية بدون إزعاج

### 3. التخزين

```sql
news_articles:
  - id (uuid)
  - title (text)
  - description (text)
  - content (text)
  - source_name (text)
  - source_url (text)
  - image_url (text)
  - category (text)
  - language (ar/en)
  - published_at (timestamp)
  - author (text)
```

---

## 📊 مصادر الأخبار

News API تجلب من أكثر من **80,000 مصدر** عالمي، منها:

### إنجليزي:
- Reuters
- BBC News
- CNN
- The Guardian
- The New York Times
- Bloomberg
- TechCrunch
- ESPN

### عربي:
- الجزيرة
- العربية
- BBC Arabic
- France 24 Arabic
- وكالات الأنباء العربية

---

## 🎯 الفوائد

### 1. أخبار حقيقية ✅
- من مصادر موثوقة
- محدّثة لحظياً
- بدون تأخير

### 2. سرعة فائقة ⚡
- تخزين محلي في قاعدة البيانات
- تحميل فوري
- تحديث ذكي

### 3. مجاني! 🎉
- Supabase: Free tier سخي جداً
- News API: 100 طلب/يوم مجاناً
- كافي لآلاف المستخدمين

---

## 🔐 الأمان

### Row Level Security (RLS)

```sql
-- الجميع يمكنهم القراءة (الأخبار عامة)
CREATE POLICY "Anyone can read news articles"
  ON news_articles FOR SELECT
  TO public USING (true);

-- فقط المصادقين يمكنهم الإضافة (النظام فقط)
CREATE POLICY "Authenticated users can insert news"
  ON news_articles FOR INSERT
  TO authenticated WITH CHECK (true);
```

### API Keys

- ✅ محمية في متغيرات البيئة
- ✅ لا تظهر في الكود
- ✅ Edge Functions آمنة

---

## 📈 الأداء

### قبل (Mock Data):
```
- أخبار ثابتة
- لا تحديثات
- محدودة جداً
```

### بعد (Live News):
```
✅ أخبار حقيقية من 80,000+ مصدر
✅ تحديث كل دقيقتين
✅ إشعارات فورية
✅ غير محدود
```

---

## 🐛 حل المشاكل

### لا تظهر الأخبار الحية؟

**الأسباب المحتملة:**

1. **Supabase غير مُعدّ:**
   - تأكد من إضافة `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`

2. **News API Key خطأ:**
   - تحقق من صحة المفتاح
   - تأكد أنك لم تتجاوز الحد اليومي (100 طلب)

3. **Edge Function لم يُنشر:**
   - تأكد من نشر `fetch-live-news` function

### رسالة "No articles found"?

- اضغط على **"🔄 تحديث"**
- سيجلب النظام أخبار جديدة فوراً

### الأخبار باللغة الخطأ?

- تأكد من اختيار اللغة الصحيحة
- بعض التصنيفات قد لا تتوفر بالعربي

---

## 💡 نصائح

### 1. توفير الطلبات
- استخدم النسخة المجانية بحكمة
- التحديث كل دقيقتين كافي جداً
- يمكنك زيادة المدة إلى 5 دقائق

### 2. تحسين الأداء
- الأخبار مُخزّنة في قاعدة البيانات
- لا حاجة لاستدعاء News API كل مرة
- التحديثات ذكية ومُحسّنة

### 3. الترقية للنسخة المدفوعة
إذا احتجت أكثر من 100 طلب/يوم:
- News API: $449/شهر (غير محدود)
- أو استخدم خدمات أخرى مثل:
  - NewsData.io
  - Currents API
  - GNews API

---

## 🎊 الخلاصة

الآن لديك نظام أخبار حي كامل:

✅ **جلب تلقائي** من 80,000+ مصدر
✅ **تحديث ذكي** كل دقيقتين
✅ **إشعارات فورية** للأخبار الجديدة
✅ **تخزين محلي** في Supabase
✅ **سرعة فائقة** في التحميل
✅ **مجاني** للاستخدام الشخصي

---

## 📞 الدعم

### الوثائق:
- News API: https://newsapi.org/docs
- Supabase: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions

### الأسئلة الشائعة:
- تحقق من console في المتصفح
- راجع ملف `.env`
- تأكد من نشر Edge Functions

---

<div align="center">

**🎉 استمتع بالأخبار الحية! 🎉**

*أخبار العالم بين يديك، لحظة بلحظة*

</div>
