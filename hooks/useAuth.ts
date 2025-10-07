import { useEffect } from 'react';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import { authService } from '../src/services/authService';
import { useAppStore } from '../store/store';

export const useAuth = () => {
  const setUser = useAppStore(state => state.setUser);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(setUser);
    return () => unsubscribe();
  }, [setUser]);
};