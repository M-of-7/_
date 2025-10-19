import type { Language, UnprocessedHeadline, UnprocessedDetails } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CATEGORIES = ['World', 'Technology', 'Sports', 'Business', 'Local', 'Politics'];

// Get API key from environment
const getApiKey = () => {
    // Try to get from import.meta.env first (Vite)
    const key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    if (!key) {
        throw new Error('API_KEY not found. Please add VITE_API_KEY to your .env file');
    }
    return key;
};

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: getApiKey() });
    }
    return aiInstance;
};


/**
 * Generates a list of headlines for a given day.
 */
export const generateHeadlinesForDay = async (date: Date, language: Language, topic: string): Promise<UnprocessedHeadline[]> => {
    const ai = getAI();
    const topicInstruction = (topic === 'all' || !topic)
        ? 'Ensure a diverse mix of headlines from all categories.'
        : `Generate headlines for the '${topic}' category ONLY.`;

    const systemInstruction = `You are a world-class news editor for a bilingual newspaper (English and Arabic).
    Your task is to generate 7 compelling, diverse, and factual news headlines.
    IMPORTANT: You must avoid creating multiple headlines for the same underlying news event to ensure variety.
    For each headline, provide a suitable category from this list: ${CATEGORIES.join(', ')}.
    Also, provide a concise, visually descriptive prompt for an AI image generator to create a compelling, photorealistic cover image for the article.`;

    const prompt = `Generate the news headlines for ${date.toDateString()} in ${language}.
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

    return JSON.parse(response.text);
};

/**
 * Generates the detailed content for a single article based on its headline.
 */
export const generateArticleDetails = async (headline: string, language: Language): Promise<UnprocessedDetails> => {
    const ai = getAI();
    const systemInstruction = `You are an expert journalist writing for a bilingual newspaper. Your task is to write a concise, neutral, and informative news article (2-3 paragraphs) based on a given headline.

    IMPORTANT INSTRUCTIONS FOR SOURCES:
    - Provide 2-3 REAL and CREDIBLE news sources
    - Use ACTUAL major news organizations like: Reuters, AP, BBC, CNN, Al Jazeera, etc.
    - The URLs must be REAL, accessible links to actual articles or the main domain
    - Do NOT make up fake URLs or sources
    - Format URLs properly: https://www.example.com/article-path
    - If you're not sure about a specific article URL, use the main domain of the news organization

    IMPORTANT INSTRUCTIONS FOR BYLINE:
    - Create realistic journalist names (not celebrities or well-known people)
    - Use professional-sounding names appropriate for the language
    - Format: "By [First Name] [Last Name]" or equivalent in Arabic`;

    const prompt = `For the headline "${headline}" in ${language}, generate the article content.
    The virality description must be one of: 'Fast Spreading', 'Medium Spreading', or 'Low Spreading' (or the equivalent in ${language}).

    Make sure sources are REAL news organizations with VALID, accessible URLs.`;

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
                required: ["body", "byline", "viralityDescription", "sources"]
            }
        }
    });

    return JSON.parse(response.text);
};


/**
 * Generates an article image.
 */
export const generateArticleImage = async (prompt: string): Promise<string> => {
    try {
        const ai = getAI();
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
        return imageUrl;
    } catch (error) {
        console.error("Image generation failed for prompt:", prompt, error);
        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1280/720`;
    }
};
