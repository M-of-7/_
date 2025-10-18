import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// Hardcode constants to avoid path issues in the Netlify build environment
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CATEGORIES = ['World', 'Technology', 'Sports', 'Business', 'Local', 'Politics'];

/**
 * Parses a JSON string, safely handling cases where the JSON is embedded
 * within a Markdown code block (```json ... ```).
 */
const parseJsonFromMarkdown = <T>(text: string): T => {
  try {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return JSON.parse(markdownMatch[1]) as T;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Failed to parse JSON from text:", text, error);
    throw new Error("Invalid JSON response from API.");
  }
};


// Helper to send consistent JSON responses
const jsonResponse = (statusCode: number, body: object) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method Not Allowed' });
    }

    if (!process.env.API_KEY) {
        return jsonResponse(500, { error: 'API_KEY environment variable not set on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const { action, payload } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'generateHeadlinesForDay': {
                const { date, language, topic } = payload;
                const topicInstruction = (topic === 'all' || !topic)
                    ? 'Ensure a diverse mix of headlines from all categories.'
                    : `Generate headlines for the '${topic}' category ONLY.`;

                const systemInstruction = `You are a world-class news editor for a bilingual newspaper (English and Arabic).
                Your task is to generate 7 compelling, diverse, and factual news headlines.
                IMPORTANT: You must avoid creating multiple headlines for the same underlying news event to ensure variety.
                Headlines MUST be specific and avoid ambiguity (e.g., instead of 'National Team Wins', specify the country like 'Brazil's National Team Wins Soccer Championship').
                For each headline, provide a suitable category from this list: ${CATEGORIES.join(', ')}.
                Also, provide a concise, visually descriptive prompt for an AI image generator to create a compelling, photorealistic cover image for the article.`;
                
                const prompt = `Generate the news headlines for ${new Date(date).toDateString()} in ${language}.
                ${topicInstruction}`;

                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: CATEGORIES },
                                    imagePrompt: { type: Type.STRING }
                                },
                                required: ["headline", "category", "imagePrompt"],
                            }
                        }
                    }
                });
                
                return jsonResponse(200, JSON.parse(response.text));
            }
            
            case 'generateArticleDetails': {
                const { headline, language } = payload;
                const systemInstruction = `You are an expert journalist writing for a bilingual newspaper. Your task is to provide content for a news article based on a given headline.
                The article MUST be grounded in real-world information.
                The article must be specific, mentioning countries, cities, company names, or people involved. Avoid vague terms like 'a local company' or 'the national team' without context.
                You MUST format your entire response as a single, minified JSON object with NO markdown formatting (e.g., no \`\`\`json).
                The JSON object must have these exact keys: "body" (string, 2-3 paragraphs), "byline" (string), "viralityDescription" (string).`;
                
                const prompt = `For the headline "${headline}" in ${language}, generate the article content.
                The "viralityDescription" value must be one of: 'Fast Spreading', 'Medium Spreading', or 'Low Spreading' (or the language-appropriate equivalent).`;

                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
                        systemInstruction,
                        tools: [{googleSearch: {}}],
                    }
                });
                
                const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
                const details = parseJsonFromMarkdown(response.text);

                return jsonResponse(200, { details, groundingMetadata });
            }

            case 'generateImage': {
                const { prompt } = payload;
                const response = await ai.models.generateImages({
                    model: IMAGE_MODEL,
                    prompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: '16:9',
                    },
                });

                if (!response.generatedImages || response.generatedImages.length === 0) {
                    throw new Error("Image generation returned no images.");
                }

                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                return jsonResponse(200, { imageUrl });
            }

            default:
                return jsonResponse(400, { error: `Unknown action: ${action}` });
        }
    } catch (error) {
        console.error('Error in Netlify function:', error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return jsonResponse(500, { error: errorMessage });
    }
};