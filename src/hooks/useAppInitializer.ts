import { useEffect } from 'react';
import { useAppStore } from '../store/store';
import { UI_TEXT } from '../constants';
import { useQueryClient } from '@tanstack/react-query';

export const useAppInitializer = () => {
    const { language, setAppStatus, setLoadingMessage, setLanguage } = useAppStore();
    const uiText = UI_TEXT[language];
    const queryClient = useQueryClient();

    useEffect(() => {
        const initialize = () => {
            setAppStatus('initializing');
            setLoadingMessage(uiText.generating_title, uiText.generating_subtitle);
            
            // API key is now handled by the serverless function.
            // The app is always in "live" mode. If the backend is not configured,
            // the data fetching query will fail and the UI will show an error message.
            setAppStatus('ready');
        };

        initialize();
    }, [language, setAppStatus, setLoadingMessage, uiText]);

    const toggleLanguage = () => {
        // Clear the query cache to force a full data refetch in the new language
        queryClient.clear();
        const newLang = language === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
    };

    return { toggleLanguage };
};