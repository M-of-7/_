import type { Language } from '../types';

/**
 * Parses a JSON string, safely handling cases where the JSON is embedded
 * within a Markdown code block (```json ... ```).
 * @param text The raw text response which may contain JSON.
 * @returns The parsed JavaScript object.
 * @throws An error if parsing fails for both raw and markdown-wrapped JSON.
 */
export const parseJsonFromMarkdown = <T>(text: string): T => {
  try {
    // First, try to find and parse JSON within a markdown block
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return JSON.parse(markdownMatch[1]) as T;
    }
    // If no markdown block, try to parse the whole string as JSON
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Failed to parse JSON from text:", text);
    throw new Error("Invalid JSON response from API.");
  }
};

/**
 * Generates a user-friendly date label (e.g., 'Today', 'Yesterday', or a formatted date).
 * @param date The date object for the article.
 * @param language The current language ('en' or 'ar').
 * @returns A formatted string.
 */
export const getDayLabel = (date: Date, language: Language): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
        return language === 'ar' ? 'اليوم' : 'Today';
    }
    if (dateOnly.getTime() === yesterday.getTime()) {
        return language === 'ar' ? 'الأمس' : 'Yesterday';
    }
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
};
