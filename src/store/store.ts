import { create } from 'zustand';
import type { Language, Article } from '../types';
import type { User } from '../services/authService';

type AppStatus = 'initializing' | 'ready' | 'error';

const LOCAL_STORAGE_KEY = 'suhf-articles-cache';

// Helper function to sort articles by date descending, preventing mutation.
const sortArticles = (articles: Article[]): Article[] => {
  return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper to save articles to local storage
const saveToLocalStorage = (articles: Article[]) => {
    try {
        // Only cache articles with text content. This avoids caching shells.
        const articlesWithContent = articles.filter(a => a.body);
        if (articlesWithContent.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(articlesWithContent));
        }
    } catch (e) {
        console.error("Failed to save articles to local storage", e);
    }
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
  activeTopic: string;
  
  // Actions
  hydrateFromLocalStorage: () => void;
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
  setActiveTopic: (topic: string) => void;
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
  activeTopic: 'all',
  
  // Actions
  hydrateFromLocalStorage: () => {
    try {
        const cachedArticlesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedArticlesJson) {
            const cachedArticles = JSON.parse(cachedArticlesJson);
            // Basic validation to ensure it's an array
            if (Array.isArray(cachedArticles)) {
                set({ articles: sortArticles(cachedArticles) });
            }
        }
    } catch (e) {
        console.error("Failed to load or parse articles from local storage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
    }
  },
  setLanguage: (language) => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ 
      language, 
      articles: [], 
      initialTodayHeadlines: [], 
      isNewEditionAvailable: false,
      appStatus: 'initializing', // Trigger re-initialization
      activeTopic: 'all',
    })
  },
  setAppStatus: (status, error = null) => set({ appStatus: status, errorMessage: error }),
  setLoadingMessage: (title, subtitle) => set({ loadingMessage: { title, subtitle } }),
  setArticles: (articles) => {
    const sorted = sortArticles(articles);
    saveToLocalStorage(sorted);
    set({ articles: sorted });
  },
  addArticles: (newArticles) => set(state => {
    const sorted = sortArticles([...state.articles, ...newArticles]);
    saveToLocalStorage(sorted);
    return { articles: sorted };
  }),
  updateArticle: (updatedArticle) => set(state => {
    const articlesMap = new Map<string, Article>(state.articles.map(a => [a.id, a]));
    articlesMap.set(updatedArticle.id, updatedArticle);
    const sorted = sortArticles(Array.from(articlesMap.values()));
    saveToLocalStorage(sorted);
    return {
        articles: sorted
    };
  }),
  updateMultipleArticles: (updatedArticles) => set(state => {
      const articlesMap = new Map<string, Article>(state.articles.map(a => [a.id, a]));
      let hasChanged = false;

      updatedArticles.forEach(updated => {
          const existing = articlesMap.get(updated.id);
          // FIX: Reversing the spread operator order to ensure that existing,
          // more detailed article data (from `existing`) is not overwritten
          // by the shell article data from the fetch (from `updated`). This
          // prevents an infinite re-render loop.
          const merged = { ...updated, ...(existing || {}) };

          // Check if it's a new article or if the article has been substantively updated.
          if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
            articlesMap.set(updated.id, merged);
            hasChanged = true;
          }
      });
      
      // If no articles were actually added or changed,
      // return the original state object to prevent an unnecessary re-render.
      if (!hasChanged) {
        return state;
      }

      const sorted = sortArticles(Array.from(articlesMap.values()));
      saveToLocalStorage(sorted);
      return {
          articles: sorted
      };
  }),
  setUser: (user) => set({ user }),
  setIsNewEditionAvailable: (isAvailable) => set({ isNewEditionAvailable: isAvailable }),
  setInitialTodayHeadlines: (headlines) => set({ initialTodayHeadlines: headlines }),
  setActiveTopic: (topic) => set(state => {
    // Invalidate articles if topic changes to force a full refetch
    if (state.activeTopic !== topic) {
      return { activeTopic: topic, articles: [] };
    }
    return { activeTopic: topic };
  }),
}));
