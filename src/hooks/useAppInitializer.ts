import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/store';

export const useAppInitializer = () => {
  const { language, setLanguage } = useAppStore();
  const queryClient = useQueryClient();

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    // Invalidate queries to refetch data in the new language
    queryClient.invalidateQueries();
  };

  return { toggleLanguage };
};
