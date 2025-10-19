# تعليمات التشغيل للتطوير المحلي
# Development Instructions

## English

### Prerequisites
1. Node.js 18 or higher
2. Google Gemini API Key

### Setup Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development API server (Terminal 1):**
```bash
npm run dev:server
```
This starts the local API server on port 3001.

3. **Start the Vite development server (Terminal 2):**
```bash
npm run dev
```
This starts the frontend on port 5173.

4. **Open your browser:**
Navigate to http://localhost:5173

### Important Notes
- You need BOTH servers running simultaneously
- The API server (port 3001) handles Gemini API calls
- The Vite dev server (port 5173) serves the React app
- The Vite proxy automatically forwards `/`.netlify/functions` requests to port 3001

---

## العربية

### المتطلبات
1. Node.js 18 أو أحدث
2. مفتاح Google Gemini API

### خطوات التشغيل

1. **تثبيت المكتبات:**
```bash
npm install
```

2. **تشغيل سيرفر API (Terminal 1):**
```bash
npm run dev:server
```
هذا يشغل سيرفر API المحلي على المنفذ 3001.

3. **تشغيل سيرفر Vite (Terminal 2):**
```bash
npm run dev
```
هذا يشغل الواجهة الأمامية على المنفذ 5173.

4. **افتح المتصفح:**
انتقل إلى http://localhost:5173

### ملاحظات مهمة
- تحتاج لتشغيل السيرفرين معاً في نفس الوقت
- سيرفر API (منفذ 3001) يتعامل مع Gemini API
- سيرفر Vite (منفذ 5173) يقدم تطبيق React
- بروكسي Vite يحول طلبات `/.netlify/functions` تلقائياً للمنفذ 3001
