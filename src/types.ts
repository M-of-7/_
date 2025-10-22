export type Category = 'World' | 'Technology' | 'Sports' | 'Business' | 'Local' | 'Politics' | 'Entertainment';

export interface Comment {
  author: string;
  text: string;
}

export interface Article {
  id: string;
  headline: string;
  byline?: string;
  date: string; // ISO 8601 format for sorting
  body?: string;
  imageUrl: string;
  imagePrompt: string;
  category: Category;
  viralityDescription?: string;
  comments: Comment[];
  sources?: { title: string; uri: string }[];
}


export interface UnprocessedHeadline {
  headline: string;
  category: Category;
  imagePrompt: string;
}

export interface UnprocessedDetails {
  body: string;
  byline: string;
  viralityDescription: string;
  sources?: { title: string; uri: string }[];
}


export type Language = 'en' | 'ar';

export interface DailyBriefing {
    date: string; // ISO 8601 format
    headlines: {
        topic: string;
        category: Category;
    }[];
}