import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Language, Article } from '../types';
import { APP_VERSION } from '../constants';

type AppStatus = 'initializing' | 'ready' | 'error';

interface AppState {
  language: Language;
  appStatus: AppStatus;
  errorMessage: string | null;
  user: User | null;
  isNewEditionAvailable: boolean;
  activeTopic: string;
  setLanguage: (language: Language) => void;
  setAppStatus: (status: AppStatus, message?: string | null) => void;
  setUser: (user: User | null) => void;
  updateArticle: (updatedArticle: Article) => void;
  setNewEditionAvailable: (isAvailable: boolean) => void;
  setActiveTopic: (topic: string) => void;
  hydrateFromLocalStorage: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'ar',
  appStatus: 'initializing',
  errorMessage: null,
  user: null,
  isNewEditionAvailable: false,
  activeTopic: 'all',
  setLanguage: (language) => {
    localStorage.setItem('suhf_lang', language);
    localStorage.setItem('suhf_version', APP_VERSION);
    set({ language });
  },
  setAppStatus: (status, message = null) => set({ appStatus: status, errorMessage: message }),
  setUser: (user) => set({ user }),
  updateArticle: (updatedArticle) =>
    set((state) => ({
      // This is a placeholder as articles are now managed by React Query.
      // The logic in the component will handle query cache updates.
    })),
  setNewEditionAvailable: (isAvailable) => set({ isNewEditionAvailable: isAvailable }),
  setActiveTopic: (topic) => set({ activeTopic: topic }), // Articles are handled by useLiveNews hook
  hydrateFromLocalStorage: () => {
    const storedLang = localStorage.getItem('suhf_lang');
    const storedVersion = localStorage.getItem('suhf_version');
    if (storedLang === 'en' || storedLang === 'ar') {
      if (storedVersion !== APP_VERSION) {
        set({ language: storedLang, isNewEditionAvailable: true });
      } else {
        set({ language: storedLang });
      }
    }
  },
}));
