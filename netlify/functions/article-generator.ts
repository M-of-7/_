import type { Handler } from "@netlify/functions";
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, TEXT_MODEL } from '../../src/services/config'; // تأكد من أن المسار صحيح

// دالة التنظيف الذكية الخاصة بك
function parseJsonFromMarkdown<T>(text: string): T {
  try {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return JSON.parse(markdownMatch[1]) as T;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Failed to parse JSON from text:", text);
    throw new Error("Invalid JSON response from API.");
  }
}

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
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const handler: Handler = async () => {
  console.log("Starting scheduled article generation...");

  try {
    const langName = 'Arabic';
    const dateISO = new Date().toISOString().split('T')[0];

    const topicsPrompt = `Use Google Search to find 4-5 real news event topics for ${dateISO}. Return ONLY a valid JSON array of strings in ${langName}. Do not use markdown.`;
    const topicsResult = await ai.models.generateContent({ model: TEXT_MODEL, contents: topicsPrompt, config: { tools: [{ googleSearch: {} }] } });
    
    // استخدام دالة التنظيف هنا
    const topics = parseJsonFromMarkdown<string[]>(topicsResult.text);

    for (const topic of topics) {
      const detailPrompt = `For the news topic "${topic}", generate a JSON object with "headline", "category" (from ${CATEGORIES.join(', ')}), and "imagePrompt". Respond ONLY with the JSON object in ${langName}. Do not use markdown.`;
      const detailResult = await ai.models.generateContent({ model: TEXT_MODEL, contents: detailPrompt, config: { tools: [{ googleSearch: {} }] } });
      
      // استخدام دالة التنظيف هنا أيضًا
      const articleData = parseJsonFromMarkdown<any>(detailResult.text);

      await db.collection('articles').add({
        ...articleData,
        createdAt: new Date(),
      });
      console.log(`Successfully generated and stored article: ${articleData.headline}`);
    }

    return { statusCode: 200, body: 'Articles generated successfully.' };
  } catch (error) {
    console.error("Error during scheduled generation:", error);
    return { statusCode: 500, body: (error as Error).message };
  }
};
