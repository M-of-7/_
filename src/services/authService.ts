import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const login = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    signInWithPopup(auth, provider)
      .then((result) => {
        resolve(result.user);
      })
      .catch((error) => {
        console.error('Authentication Error:', error);
        reject(error);
      });
  });
};

const logout = (): Promise<void> => {
  return signOut(auth);
};

const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const authService = {
  login,
  logout,
  onAuthChange,
  getAuth: () => auth,
};
