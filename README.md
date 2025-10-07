# صحف (suhf) - دليل التشغيل (Setup Guide)

مرحباً! هذا الدليل سيساعدك على تشغيل التطبيق على جهازك المحلي بنجاح.

Welcome! This guide will help you run the application successfully on your local machine.

---

## المفهوم الأساسي (The Core Concept)

هذا المشروع يستخدم واجهة أمامية حديثة (React, Vite) وواجهة خلفية بدون خادم (Netlify Functions) للتواصل مع Google Gemini API.

-   **الواجهة الخلفية (Backend):** توجد في مجلد `netlify/functions`. هذه الوظائف هي المكان الوحيد الذي يتم فيه استخدام مفتاح Gemini API الخاص بك، مما يجعله آمنًا.
-   **الواجهة الأمامية (Frontend):** تتصل بوظائف Netlify لجلب البيانات. **لا يمكنك فتح ملف `index.html` مباشرة في المتصفح.**

يجب "بناء" أو "تجميع" الكود أولاً.

-   **على جهازك المحلي:** الأمر `netlify dev` يقوم ببناء كل شيء ويشغّل خادمًا محليًا يحاكي بيئة Netlify.
-   **على Netlify:** عندما ترفع الكود، يقوم Netlify بتشغيل الأمر `npm run build` لبناء الملفات النهائية لموقعك.

This project uses a modern frontend (React, Vite) and a serverless backend (Netlify Functions) to communicate with the Google Gemini API.

-   **Backend:** Located in the `netlify/functions` folder. These functions are the only place your Gemini API key is used, keeping it secure.
-   **Frontend:** Calls your Netlify functions to fetch data. **You cannot open the `index.html` file directly in your browser.**

The code must be "built" or "compiled" first.

-   **On your local machine:** The `netlify dev` command builds everything and runs a local server that mimics the Netlify environment.
-   **On Netlify:** When you push your code, Netlify runs the `npm run build` command to create the final files for your website.

---

## خطوات التشغيل المحلي (Steps for Local Setup)

اتبع هذه الخطوات **بالترتيب** في الطرفية (Terminal) داخل مجلد المشروع:

Follow these steps **in order** in your terminal, inside the project folder:

### 1. تثبيت الاعتماديات (Install Dependencies)

هذا الأمر يقوم بتحميل كل المكتبات التي يحتاجها المشروع (مثل React). تحتاج لتشغيله مرة واحدة فقط في البداية.
This command downloads all the libraries the project needs (like React). You only need to run this once at the beginning.

```bash
npm install
```

### 2. تثبيت Netlify CLI (Install Netlify CLI)
إذا لم تكن قد ثبّتته من قبل، ستحتاج إلى Netlify CLI لتشغيل الوظائف بدون خادم محليًا.
If you haven't already, you'll need the Netlify CLI to run the serverless functions locally.

```bash
npm install -g netlify-cli
```

### 3. تشغيل خادم التطوير (Run the Development Server)

استخدم `netlify dev` لتشغيل الواجهة الأمامية والخلفية معًا. سيعطيك رابطًا (عادة `http://localhost:8888`) لتفتحه في متصفحك.
Use `netlify dev` to run both the frontend and backend together. It will give you a link (usually `http://localhost:8888`) to open in your browser.

```bash
netlify dev
```

**مهم جداً:** اترك الطرفية (Terminal) مفتوحة طوال فترة عملك. إذا أغلقتها، سيتوقف الخادم.

**Very Important:** Keep the terminal window open while you are working. If you close it, the server will stop.

---

## متغيرات البيئة (Environment Variables)

يحتاج التطبيق إلى مفتاح Gemini API ليعمل. يتم توفير هذا المفتاح للواجهة الخلفية فقط.

The application needs a Gemini API key to function. This key is provided to the backend only.

### للتطوير المحلي (For Local Development)
1.  أنشئ ملفًا جديدًا في المجلد الرئيسي للمشروع باسم `.env`.
    Create a new file in the root of the project named `.env`.
2.  أضف السطر التالي داخل الملف، مع استبدال `YOUR_KEY_HERE` بمفتاحك الخاص. **لا تستخدم `VITE_` كبادئة.**
    Add the following line inside the file, replacing `YOUR_KEY_HERE` with your actual key. **Do not use the `VITE_` prefix.**

    ```
    API_KEY="YOUR_KEY_HERE"
    ```
    سيقرأ `netlify dev` هذا الملف تلقائيًا.

### للنشر (For Deployment - e.g., Netlify)

عند نشر موقعك، تحتاج إلى تعيين نفس متغير البيئة في إعدادات منصة النشر الخاصة بك.

When deploying your site, you need to set the same environment variable in your deployment platform's settings.

-   **اسم المتغير (Variable Name):** `API_KEY`
-   **قيمة المتغير (Variable Value):** `YOUR_KEY_HERE` (مفتاحك الخاص)

هذا يضمن أن وظائف الواجهة الخلفية يمكنها الوصول إلى المفتاح بأمان. لن يتم كشف المفتاح أبدًا في كود الواجهة الأمامية.

This ensures the backend functions can access the key securely. The key will never be exposed in the frontend code.