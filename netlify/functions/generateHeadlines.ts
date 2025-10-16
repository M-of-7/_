import type { Handler } from "@netlify/functions";
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// تهيئة Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!) as ServiceAccount;
try {
  initializeApp({ credential: cert(serviceAccount) });
} catch (error) {
  if (!/already exists/u.test((error as Error).message)) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = getFirestore();

export const handler: Handler = async () => {
  try {
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.orderBy('createdAt', 'desc').limit(5).get();

    if (snapshot.empty) {
      return {
        statusCode: 200, // نرجع 200 مع مصفوفة فارغة بدلاً من خطأ
        body: JSON.stringify([]),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const articles: any[] = [];
    snapshot.forEach(doc => {
      articles.push({ id: doc.id, ...doc.data() });
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articles),
    };

  } catch (error: any) { // تم تحسين معالجة الأخطاء هنا
    console.error("Error fetching articles:", error);
    
    // هذا الجزء هو المهم: نرجع رسالة الخطأ الأصلية من Firestore
    const errorMessage = error.details || error.message || 'Failed to fetch articles.';
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
