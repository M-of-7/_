import { useEffect } from 'react';
import { authService } from '../services/authService';
import { useAppStore } from '../store/store';

export const useAuth = () => {
  const { setUser } = useAppStore();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthChange((user) => {
      setUser(user);
    });

    // Unsubscribe on component unmount
    return () => unsubscribe();
  }, [setUser]);
};
