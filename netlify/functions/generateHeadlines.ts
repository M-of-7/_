import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";
import type { Language, UnprocessedHeadline, UnprocessedDetails } from '../../src/types';
import { CATEGORIES } from '../../src/constants';
import { TEXT_MODEL, IMAGE_MODEL } from '../../src/services/config';


// Helper to get the AI instance, ensuring API key is set.
function getAiInstance(): GoogleGenAI {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set on the server.");
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to parse JSON, potentially from a markdown block.
function parseJsonFromMarkdown<T>(text: string): T {
    try {
      // The Gemini API can sometimes wrap the JSON in ```json ... ```.
      const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        return JSON.parse(markdownMatch[1]) as T;
      }
      // If no markdown block, try to parse the whole string.
      return JSON.parse(text) as T;
    } catch (error) {
      console.error("Failed to parse JSON from text:", text);
      throw new Error("Invalid JSON response from API.");
    }
}

// --- الكود النهائي المجمع الذي يحل مشكلة السرعة والخطأ ---

async function handleGenerateHeadlinesForDay(payload: any): Promise<UnprocessedHeadline[]> {
    const { date: dateString, language } = payload;
    if (!dateString || !language) throw new Error('Missing date or language in payload.');

    const date = new Date(dateString);
    const ai = getAiInstance();
    const dateISO = date.toISOString().split('T')[0];
    const langName = language === 'ar' ? 'Arabic' : 'English';

    // --- الخطوة الأولى: طلب سريع للحصول على المواضيع الرئيسية فقط ---
    const topicsPrompt = `
        Use Google Search to find 4-5 of the most significant, real news event topics for the date ${dateISO}.
        Respond ONLY with a valid JSON array of strings, where each string is a brief topic.
        Example: ["US election results", "Major earthquake in Japan", "New iPhone announced"]
        Ensure the topics are in ${langName}. Do not use markdown.
    `;

    const topicsResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: topicsPrompt,
        config: {
            tools: [{ googleSearch: {} }],
            // --- تم التأكد من حذف responseMimeType ---
        },
    });
    
    // --- نستخدم دالتك الأصلية والموثوقة للتحليل ---
    const topics = parseJsonFromMarkdown<string[]>(topicsResponse.text);
    if (!topics || topics.length === 0) {
        throw new Error("Could not generate news topics.");
    }

    // --- الخطوة الثانية: طلب تفاصيل كل موضوع واحدًا تلو الآخر ---
    const headlines: UnprocessedHeadline[] = [];
    for (const topic of topics) {
        const detailPrompt = `
            For the news topic "${topic}" on date ${dateISO}, act as a news editor.
            Generate a single JSON object with the following structure:
            - "headline": A compelling headline in ${langName}.
            - "category": One of these: ${CATEGORIES.join(', ')}.
            - "imagePrompt": A descriptive prompt for an AI image generator to create a realistic photo for this article.
            Respond ONLY with a single, valid JSON object without markdown.
        `;
        
        const detailResponse = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: detailPrompt,
            config: {
                tools: [{ googleSearch: {} }],
                // --- تم التأكد من حذف responseMimeType ---
            },
        });

        const headlineDetails = parseJsonFromMarkdown<UnprocessedHeadline>(detailResponse.text);
        headlines.push(headlineDetails);
    }

    return headlines;
}
// Generates the details for a single article from a headline
async function handleGenerateArticleDetails(payload: any): Promise<UnprocessedDetails> {
    const { headline, language } = payload;
    if (!headline || !language) throw new Error('Missing headline or language in payload.');

    const ai = getAiInstance();
    const langName = language === 'ar' ? 'Arabic' : 'English';
    const viralityEnums = language === 'ar' 
        ? ['سريع الانتشار', 'متوسط الانتشار', 'قليل الانتشار'] 
        : ['Fast Spreading', 'Medium Spreading', 'Low Spreading'];

    const prompt = `
        Act as a journalist. For the headline "${headline}", write a newspaper article in ${langName}.
        Use Google Search to find information about this event to write the article accurately.
        Return a single JSON object with the following structure:
        - body: 1-2 detailed paragraphs, formatted with newline characters (\\n).
        - byline: The name of a plausible news desk or agency.
        - viralityDescription: Must be one of the allowed values: ${viralityEnums.join(', ')}.
        - sources: An array of 1-2 objects with "title" and "uri" for real sources, if available.
        
        Ensure all text content is in ${langName}.
        Respond ONLY with a single, valid JSON object. Do not include markdown formatting.
    `;

    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return parseJsonFromMarkdown<UnprocessedDetails>(response.text);
}

// Sub-handler for generating an image
async function handleGenerateImage(payload: any): Promise<{ imageUrl: string }> {
    const { prompt } = payload;
    if (!prompt) throw new Error('Missing prompt in payload.');
    
    const ai = getAiInstance();
    const response = await ai.models.generateImages({
        model: IMAGE_MODEL,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return { imageUrl: `data:image/jpeg;base64,${base64ImageBytes}` };
    }
    throw new Error("No image was generated by the API.");
}

// Sub-handler for filtering headlines
async function handleFilterHeadlines(payload: any): Promise<string[]> {
    const { headlines, mood, language } = payload;
    if (!headlines || !mood || !language) throw new Error('Missing headlines, mood, or language in payload.');
    
    const langName = language === 'ar' ? 'Arabic' : 'English';
    const ai = getAiInstance();

    const prompt = `
        From the following list of news headlines, select only the ones that best fit the mood or theme of "${mood}".
        The headlines are in ${langName}.
        Return a JSON array containing only the string IDs of the headlines that match.
        
        Headlines:
        ${JSON.stringify(headlines, null, 2)}
    `;

    const moodSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.STRING
        }
    };
    
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: moodSchema,
        },
    });
    return JSON.parse(response.text);
}


// Main Netlify Function Handler
const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, payload } = JSON.parse(event.body || '{}');
        let result;

        switch (action) {
            case 'generateHeadlinesForDay':
                result = await handleGenerateHeadlinesForDay(payload);
                break;
            case 'generateArticleDetails':
                result = await handleGenerateArticleDetails(payload);
                break;
            case 'generateImage':
                result = await handleGenerateImage(payload);
                break;
            case 'filterHeadlines':
                result = await handleFilterHeadlines(payload);
                break;
            default:
                throw new Error(`Invalid action provided: ${action}`);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error("Error in Netlify function:", error);
        const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: message }),
        };
    }
};

export { handler };
