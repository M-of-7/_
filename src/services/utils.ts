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
