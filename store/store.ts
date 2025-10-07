import { create } from 'zustand';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { Language, Article } from '../src/types';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { User } from '../src/services/authService';

type AppStatus = 'initializing' | 'ready' | 'error';

// Helper function to sort articles by date descending, preventing mutation.
const sortArticles = (articles: Article[]): Article[] => {
  return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};


interface AppState {
  language: Language;
  appStatus: AppStatus;
  errorMessage: string | null;
  loadingMessage: { title: string; subtitle: string };
  articles: Article[];
  user: User | null;
  isNewEditionAvailable: boolean;
  initialTodayHeadlines: string[];
  
  // Actions
  setLanguage: (language: Language) => void;
  setAppStatus: (status: AppStatus, error?: string | null) => void;
  setLoadingMessage: (title: string, subtitle: string) => void;
  setArticles: (articles: Article[]) => void;
  addArticles: (newArticles: Article[]) => void;
  updateArticle: (updatedArticle: Article) => void;
  updateMultipleArticles: (updatedArticles: Article[]) => void;
  setUser: (user: User | null) => void;
  setIsNewEditionAvailable: (isAvailable: boolean) => void;
  setInitialTodayHeadlines: (headlines: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // State
  language: 'ar',
  appStatus: 'initializing',
  errorMessage: null,
  loadingMessage: { title: '', subtitle: '' },
  articles: [],
  user: null,
  isNewEditionAvailable: false,
  initialTodayHeadlines: [],
  
  // Actions
  setLanguage: (language) => set({ 
    language, 
    articles: [], 
    initialTodayHeadlines: [], 
    isNewEditionAvailable: false,
    appStatus: 'initializing' // Trigger re-initialization
  }),
  setAppStatus: (status, error = null) => set({ appStatus: status, errorMessage: error }),
  setLoadingMessage: (title, subtitle) => set({ loadingMessage: { title, subtitle } }),
  setArticles: (articles) => set({
    articles: sortArticles(articles)
  }),
  addArticles: (newArticles) => set(state => ({
    articles: sortArticles([...state.articles, ...newArticles])
  })),
  updateArticle: (updatedArticle) => set(state => {
    // FIX: Explicitly typed the Map to fix type inference issues with `articlesMap.values()`.
    const articlesMap = new Map<string, Article>(state.articles.map(a => [a.id, a]));
    articlesMap.set(updatedArticle.id, updatedArticle);
    return {
        articles: sortArticles(Array.from(articlesMap.values()))
    };
  }),
  updateMultipleArticles: (updatedArticles) => set(state => {
      // FIX: Explicitly typed the Map to fix type inference issues with `articlesMap.values()`.
      const articlesMap = new Map<string, Article>(state.articles.map(a => [a.id, a]));
      updatedArticles.forEach(updated => articlesMap.set(updated.id, updated));
      return {
          articles: sortArticles(Array.from(articlesMap.values()))
      };
  }),
  setUser: (user) => set({ user }),
  setIsNewEditionAvailable: (isAvailable) => set({ isNewEditionAvailable: isAvailable }),
  setInitialTodayHeadlines: (headlines) => set({ initialTodayHeadlines: headlines }),
}));