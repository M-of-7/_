# 📰 صحف (Suhf) - AI News App

> تطبيق أخبار ذكي ثنائي اللغة (عربي/إنجليزي) مدعوم بـ Google Gemini AI
>
> Bilingual (Arabic/English) AI-powered news application using Google Gemini

---

## 🎯 ملخص سريع / Quick Summary

تطبيق ويب حديث يولد أخباراً مخصصة باستخدام الذكاء الاصطناعي مع تصميم عصري وتجربة مستخدم ممتازة.

A modern web app that generates personalized news using AI with a contemporary design and excellent user experience.

---

## ✨ الميزات / Features

- 🤖 توليد أخبار بالذكاء الاصطناعي / AI-powered news generation
- 🌐 دعم كامل للعربية والإنجليزية / Full Arabic & English support
- 🎨 تصميم عصري مع تأثيرات جميلة / Modern design with beautiful effects
- 📱 متجاوب تماماً / Fully responsive
- 🔍 بحث وتصفية / Search and filtering
- 💬 تعليقات وتفاعل / Comments and interaction
- 🖼️ صور مولدة بالذكاء الاصطناعي / AI-generated images
- ⚡ سريع وسلس / Fast and smooth

---

## 🚀 البدء السريع / Quick Start

### المتطلبات / Prerequisites
- Node.js 18 أو أحدث / or higher
- مفتاح Google Gemini API / Google Gemini API Key

### التثبيت / Installation

```bash
# 1. استنسخ المشروع / Clone the project
git clone <your-repo>
cd suhf-app

# 2. ثبّت المكتبات / Install dependencies
npm install

# 3. أنشئ ملف .env وأضف مفتاح API / Create .env and add API key
echo "API_KEY=your_gemini_api_key" > .env
```

### التشغيل / Running

#### للتطوير المحلي / For Local Development

**⚠️ مهم: يجب تشغيل سيرفرين! / Important: Must run TWO servers!**

```bash
# Terminal 1 - API Server
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

افتح المتصفح على / Open browser at: `http://localhost:5173`

#### للنشر / For Deployment

```bash
# البناء / Build
npm run build

# المعاينة / Preview
npm run preview
```

---

## 📚 التوثيق / Documentation

### ملفات مهمة / Important Files

1. **START_HERE.md** - ابدأ من هنا! / Start here!
2. **QUICK_START.md** - دليل سريع / Quick guide
3. **COMPLETE_SETUP.md** - دليل شامل / Complete guide

---

## 🎨 ما الجديد / What's New

### تحسينات التصميم / Design Improvements

- ✨ Header بتدرجات لونية عصرية
- 🎯 بطاقات مقالات محسّنة مع hover effects
- 💫 أنيميشن سلسة للمودال
- 🎨 نظام ألوان محسّن (slate)
- 📱 تصميم responsive أفضل
- ⚡ Loading states جذابة

### إصلاحات تقنية / Technical Fixes

- ✅ إضافة API server محلي
- ✅ حل مشاكل "Not Found"
- ✅ تحسين error handling
- ✅ إزالة أخطاء TypeScript
- ✅ Build يعمل بنجاح

---

## 🛠️ التقنيات / Technologies

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State:** Zustand + React Query
- **AI:** Google Gemini API
- **Backend:** Netlify Functions / Express (dev)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication

---

## 📁 الهيكل / Structure

```
suhf-app/
├── src/
│   ├── components/      # React components
│   ├── services/        # API & Firebase
│   ├── hooks/           # Custom hooks
│   ├── store/           # State management
│   └── App.tsx          # Main app
├── netlify/functions/   # Serverless functions
├── server.js            # Local dev API
└── vite.config.ts       # Vite config
```

---

## ⚠️ ملاحظات مهمة / Important Notes

### للتطوير المحلي / For Local Development

1. **يجب** تشغيل سيرفرين في نفس الوقت
   You **must** run two servers simultaneously

2. السيرفر الأول (3001) للـ API
   First server (3001) for API

3. السيرفر الثاني (5173) للواجهة
   Second server (5173) for frontend

### للنشر / For Deployment

- على Netlify، كل شيء يعمل تلقائياً
  On Netlify, everything works automatically

- لا تنسَ إضافة `API_KEY` في Environment Variables
  Don't forget to add `API_KEY` in Environment Variables

---

## 🐛 حل المشاكل / Troubleshooting

### خطأ "Not Found"

```bash
# تأكد من تشغيل API server
npm run dev:server
```

### خطأ "API_KEY not set"

```bash
# أضف في ملف .env
API_KEY=your_actual_api_key
```

### مشاكل npm install

```bash
# جرب
npm install --legacy-peer-deps
```

---

## 📖 المزيد من المعلومات / More Information

اقرأ الملفات التالية للحصول على معلومات مفصلة:

Read these files for detailed information:

- **START_HERE.md** - نقطة البداية / Starting point
- **QUICK_START.md** - بدء سريع / Quick start
- **COMPLETE_SETUP.md** - دليل شامل / Complete guide
- **DEV_INSTRUCTIONS.md** - للمطورين / For developers

---

## 🎉 الخلاصة / Summary

التطبيق الآن:
- ✅ بدون أخطاء
- ✅ تصميم عصري
- ✅ أداء ممتاز
- ✅ جاهز للاستخدام

The app is now:
- ✅ Error-free
- ✅ Modern design
- ✅ Excellent performance
- ✅ Ready to use

**استمتع! / Enjoy!** 🚀

---

## 📄 الترخيص / License

MIT License - مفتوح المصدر / Open Source

## 👥 المساهمة / Contributing

المساهمات مرحب بها! / Contributions are welcome!

---

Made with ❤️ using React + Gemini AI
