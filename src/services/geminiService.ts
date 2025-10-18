import type { Language, UnprocessedHeadline, UnprocessedDetails, GroundingMetadata } from '../types';

/**
 * A helper function to call our Netlify serverless function which acts as a proxy to the Gemini API.
 * This keeps the API key secure on the backend.
 * @param action - The specific API action to perform (e.g., 'generateArticles').
 * @param payload - The data required for that action.
 * @returns The JSON response from the serverless function.
 */
async function callGeminiApi(action: string, payload: object) {
    const response = await fetch('/.netlify/functions/generateHeadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.statusText}` }));
        throw new Error(errorData.error || `An unknown error occurred.`);
    }

    return response.json();
}


/**
 * Generates a list of headlines for a given day. This is a lightweight call designed to be fast.
 */
export const generateHeadlinesForDay = async (date: Date, language: Language, topic: string): Promise<UnprocessedHeadline[]> => {
    return callGeminiApi('generateHeadlinesForDay', { date: date.toISOString(), language, topic });
};

/**
 * Generates the detailed content for a single article based on its headline.
 */
export const generateArticleDetails = async (headline: string, language: Language): Promise<{ details: UnprocessedDetails, groundingMetadata: GroundingMetadata | null }> => {
    return callGeminiApi('generateArticleDetails', { headline, language });
};


/**
 * Generates an article image by calling the backend proxy.
 */
export const generateArticleImage = async (prompt: string): Promise<string> => {
    try {
        const result = await callGeminiApi('generateImage', { prompt });
        return result.imageUrl;
    } catch (error) {
        console.error("Image generation failed for prompt:", prompt, error);
        // Return a placeholder on failure to prevent UI from breaking
        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1280/720`;
    }
};