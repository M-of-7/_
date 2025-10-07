import { GoogleGenAI, Type } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

// Constants are inlined to make the function self-contained.
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CATEGORIES = ['World', 'Technology', 'Sports', 'Business', 'Local'];

// Utility to parse JSON that might be in a markdown block
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


const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!process.env.API_KEY) {
        console.error('API_KEY environment variable not set.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API_KEY environment variable not set on the server.' })
        };
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const { action, payload } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'generateHeadlinesForDay': {
                const { date, language } = payload;
                const formattedDate = new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const langInstruction = language === 'ar' ? 'in Arabic' : 'in English';

                const prompt = `You are a world-class news editor for a global, bilingual newspaper.
Generate a list of 5 diverse and compelling news headlines for ${formattedDate}.
The headlines should be suitable for a general audience and cover a range of topics.
For each headline, provide:
1.  A "headline" (string).
2.  A "category" (string) from this exact list: ${CATEGORIES.join(', ')}.
3.  An "imagePrompt" (string) for an AI image generator to create a compelling, photorealistic, high-quality photograph for the article. Describe the scene, lighting, and composition.

The entire response must be in valid JSON format. All text content you generate must be ${langInstruction}.`;

                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    imagePrompt: { type: Type.STRING }
                                },
                                required: ["headline", "category", "imagePrompt"]
                            }
                        }
                    }
                });

                const headlines = parseJsonFromMarkdown(response.text);
                return { statusCode: 200, body: JSON.stringify(headlines) };
            }

            case 'generateArticleDetails': {
                const { headline, language } = payload;
                const langInstruction = language === 'ar' ? 'in Arabic' : 'in English';

                const prompt = `You are a senior journalist. Write a news article based on the following headline: "${headline}".
The article should be:
-   Approximately 250-300 words long.
-   Written in a neutral, informative, and engaging journalistic style.
-   Formatted into at least 3 paragraphs.

Based on the article's content, provide the following metadata:
1.  "body": The full text of the article, with paragraphs separated by newline characters (\\n).
2.  "byline": A plausible, fictional byline (e.g., "Tech Desk", "Global News Wire", "Sports Correspondent").
3.  "viralityDescription": A short phrase describing its potential virality. Choose from these exact options: "Fast Spreading", "Medium Spreading", or "Low Spreading".
4.  "sources": An array of 1-2 fictional but plausible source links related to the article, each with a "title" and a "uri". The URI can be a placeholder like "#".

The entire response must be in valid JSON format. All text content you generate must be ${langInstruction}.`;

                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
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
                            required: ["body", "byline", "viralityDescription", "sources"]
                        }
                    }
                });
                
                const details = parseJsonFromMarkdown(response.text);
                return { statusCode: 200, body: JSON.stringify(details) };
            }
            
            case 'generateImage': {
                const { prompt } = payload;
                const response = await ai.models.generateImages({
                    model: IMAGE_MODEL,
                    prompt: `${prompt}, photorealistic, 8k, sharp focus`,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                    },
                });

                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                return { statusCode: 200, body: JSON.stringify({ imageUrl }) };
            }

            case 'filterHeadlines': {
                const { headlines, mood, language } = payload;
                const langInstruction = language === 'ar' ? 'in Arabic' : 'in English';
                const headlinesText = headlines.map((h: { id: string; text: string; }) => `ID: ${h.id} | Headline: ${h.text}`).join('\n');
                
                const prompt = `You are an AI news curator. I have a list of headlines.
Your task is to identify which headlines match the mood or category: "${mood}".

Here is the list of headlines with their IDs:
${headlinesText}

Analyze the headlines and return a JSON array containing only the IDs of the headlines that match the specified mood. The IDs must be strings.
The entire response must be in valid JSON format.
Your analysis and response content must be based on the provided text, which is ${langInstruction}.`;
                
                const response = await ai.models.generateContent({
                    model: TEXT_MODEL,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                });

                const filteredIds = parseJsonFromMarkdown(response.text);
                return { statusCode: 200, body: JSON.stringify(filteredIds) };
            }
                
            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
        }
    } catch (error: any) {
        console.error('Netlify function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred.' })
        };
    }
};

export { handler };
