# البدء السريع / Quick Start

## للتطوير المحلي / For Local Development

### ⚠️ مهم جداً / VERY IMPORTANT

يجب تشغيل **سيرفرين** في نفس الوقت!
You must run **TWO servers** simultaneously!

### الخطوات / Steps

1. **تثبيت المكتبات / Install dependencies:**
```bash
npm install
```

2. **إضافة مفتاح API / Add API Key:**

أنشئ ملف `.env` وأضف:
Create `.env` file and add:

```env
API_KEY=your_google_gemini_api_key_here
```

3. **افتح نافذتي Terminal / Open 2 Terminals:**

**Terminal 1:**
```bash
npm run dev:server
```
يجب أن ترى: `Dev server running on http://localhost:3001`
You should see: `Dev server running on http://localhost:3001`

**Terminal 2:**
```bash
npm run dev
```
يجب أن ترى: `VITE ... ready in ... ms`
You should see: `VITE ... ready in ... ms`

4. **افتح المتصفح / Open Browser:**
```
http://localhost:5173
```

---

## الأخطاء الشائعة / Common Errors

### ❌ خطأ "Not Found"

**المشكلة:** لم يتم تشغيل API server
**Problem:** API server not running

**الحل:**
**Solution:**
```bash
# في Terminal منفصل / In separate Terminal
npm run dev:server
```

### ❌ خطأ "Failed to fetch"

**المشكلة:** السيرفر غير متصل
**Problem:** Server not connected

**تحقق من:**
**Check:**
1. السيرفر يعمل على port 3001
   Server running on port 3001
2. لا يوجد firewall يمنع الاتصال
   No firewall blocking connection

### ❌ خطأ "API_KEY not set"

**المشكلة:** مفتاح API غير موجود
**Problem:** API key missing

**الحل:**
**Solution:**
أضف مفتاح API في ملف `.env`:
Add API key in `.env` file:
```env
API_KEY=your_actual_api_key_here
```

---

## النشر / Deployment

للنشر على Netlify، استخدم:
To deploy on Netlify, use:

1. Push to GitHub
2. Connect to Netlify
3. إضافة `API_KEY` في Environment Variables
   Add `API_KEY` in Environment Variables
4. Deploy!

**ملاحظة:** على Netlify، لا تحتاج لتشغيل `dev:server`
**Note:** On Netlify, you don't need to run `dev:server`

---

## تحديثات التصميم الجديدة / New Design Updates

✨ **تحسينات UI/UX:**
- Header بتدرجات لونية عصرية
- بطاقات بتأثيرات hover جميلة
- أنيميشن سلسة للمودال
- ألوان أفضل للقراءة
- تصميم responsive محسّن

✨ **UI/UX Improvements:**
- Modern gradient header
- Beautiful card hover effects
- Smooth modal animations
- Better colors for readability
- Enhanced responsive design
