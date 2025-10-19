# صحف - تطبيق الأخبار بالذكاء الاصطناعي
# Suhf - AI-Powered News App

## نظرة عامة / Overview

تطبيق ويب ثنائي اللغة (عربي/إنجليزي) يولد أخباراً مخصصة باستخدام Google Gemini AI.

A bilingual (Arabic/English) web application that generates personalized news using Google Gemini AI.

---

## المتطلبات / Requirements

- Node.js 18 أو أحدث / Node.js 18 or higher
- npm أو yarn
- مفتاح Google Gemini API / Google Gemini API Key
- (اختياري) حساب Firebase للتعليقات / (Optional) Firebase account for comments

---

## التثبيت / Installation

### 1. استنساخ المشروع / Clone the project

```bash
git clone <your-repo-url>
cd suhf-app
```

### 2. تثبيت المكتبات / Install dependencies

```bash
npm install
```

إذا واجهت مشاكل في التثبيت، حاول:
If you face installation issues, try:

```bash
npm install --legacy-peer-deps
```

### 3. إعداد ملف البيئة / Setup environment file

أنشئ ملف `.env` في المجلد الرئيسي وأضف:
Create a `.env` file in the root directory and add:

```env
API_KEY=your_google_gemini_api_key_here
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_key_here
```

---

## التشغيل للتطوير / Development Mode

### الطريقة 1: تشغيل كلا السيرفرين / Method 1: Run both servers

افتح نافذتي terminal:
Open two terminal windows:

**Terminal 1 - API Server:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

ثم افتح المتصفح على:
Then open your browser at:
```
http://localhost:5173
```

### الطريقة 2: استخدام الموقع المنشور / Method 2: Use deployed site

إذا كان الموقع منشوراً على Netlify، يمكنك الوصول إليه مباشرة:
If the site is deployed on Netlify, you can access it directly at:
```
https://your-site-name.netlify.app
```

---

## البناء للإنتاج / Production Build

```bash
npm run build
```

سيتم إنشاء ملفات الإنتاج في مجلد `dist/`.
Production files will be generated in the `dist/` directory.

---

## النشر / Deployment

### Netlify Deployment

1. ادفع الكود إلى GitHub / Push code to GitHub
2. اربط المشروع بـ Netlify / Connect project to Netlify
3. أضف متغيرات البيئة في إعدادات Netlify:
   Add environment variables in Netlify settings:
   - `API_KEY` - مفتاح Google Gemini API / Your Google Gemini API Key

4. Netlify ستتولى البناء والنشر تلقائياً
   Netlify will handle build and deployment automatically

---

## الميزات / Features

✅ توليد أخبار بالذكاء الاصطناعي / AI-powered news generation
✅ دعم كامل للعربية والإنجليزية / Full Arabic & English support
✅ تصميم متجاوب / Responsive design
✅ تصفية حسب المواضيع / Topic filtering
✅ بحث في المقالات / Article search
✅ تحديث تلقائي / Auto-refresh
✅ مشاركة على وسائل التواصل / Social media sharing
✅ تسجيل دخول والتعليقات (Firebase) / Login & Comments (Firebase)
✅ صور مولدة بالذكاء الاصطناعي / AI-generated images

---

## حل المشاكل / Troubleshooting

### خطأ "Not Found" / "Not Found" Error

تأكد من تشغيل API server:
Make sure API server is running:

```bash
npm run dev:server
```

### خطأ في Firebase

تحقق من إعدادات Firebase في `src/config.ts`
Check Firebase configuration in `src/config.ts`

### مشاكل في البناء / Build Issues

امسح `node_modules` و أعد التثبيت:
Clear `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## الهيكل / Structure

```
suhf-app/
├── src/
│   ├── components/     # React components
│   ├── services/       # API & Firebase services
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand state management
│   ├── App.tsx         # Main app component
│   └── config.ts       # Configuration
├── netlify/
│   └── functions/      # Serverless functions
├── server.js           # Local development API
└── vite.config.ts      # Vite configuration
```

---

## التقنيات المستخدمة / Technologies

- **Frontend:** React + TypeScript + Tailwind CSS
- **State Management:** Zustand + React Query
- **AI:** Google Gemini API
- **Backend:** Netlify Functions / Express (dev)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Build:** Vite

---

## الترخيص / License

هذا المشروع مفتوح المصدر
This project is open source

---

## المساهمة / Contributing

المساهمات مرحب بها!
Contributions are welcome!

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
