import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CATEGORIES = ['World', 'Technology', 'Sports', 'Business', 'Local', 'Politics'];

app.post('/.netlify/functions/generateHeadlines', async (req, res) => {
    try {
        if (!process.env.API_KEY) {
            return res.status(500).json({ error: 'API_KEY environment variable not set on the server.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { action, payload } = req.body;

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

                return res.json(JSON.parse(response.text));
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
                return res.json(JSON.parse(response.text));
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

                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                return res.json({ imageUrl });
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (error) {
        console.error('Error in API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
        return res.status(500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Dev server running on http://localhost:${PORT}`);
});
