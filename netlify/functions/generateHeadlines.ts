import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// Hardcode constants to avoid path issues in the Netlify build environment
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CATEGORIES = ['World', 'Technology', 'Sports', 'Business', 'Local', 'Politics'];

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
                const systemInstruction = `You are an expert journalist writing for a bilingual newspaper. Your task is to write a concise, neutral, and informative news article (2-3 paragraphs) based on a given headline.
                You must also provide a realistic byline, a virality description, and 1-2 plausible sources.`;
                
                const prompt = `For the headline "${headline}" in ${language}, generate the article content.
                The virality description must be one of: 'Fast Spreading', 'Medium Spreading', or 'Low Spreading' (or the equivalent in ${language}).`;

                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                body: { type: Type.STRING },
                                byline: { type: Type.STRING },
                                viralityDescription: { type: Type.STRING },
                                sources: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            title: { type: Type.STRING },
                                            uri: { type: Type.STRING }
                                        },
                                        required: ["title", "uri"]
                                    }
                                }
                            },
                            required: ["body", "byline", "viralityDescription"]
                        }
                    }
                });
                return jsonResponse(200, JSON.parse(response.text));
            }

            case 'generateImage': {
                const { prompt } = payload;
                const response = await ai.models.generateImages({
                    model: IMAGE_MODEL,
                    prompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/png',
                        aspectRatio: '16:9',
                    },
                });

                if (!response.generatedImages || response.generatedImages.length === 0) {
                    throw new Error("Image generation returned no images.");
                }

                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
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
