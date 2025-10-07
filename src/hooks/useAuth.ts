import { useEffect } from 'react';
import { authService } from '../services/authService';
import { useAppStore } from '../store/store';

export const useAuth = () => {
  const setUser = useAppStore(state => state.setUser);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(setUser);
    return () => unsubscribe();
  }, [setUser]);
};
