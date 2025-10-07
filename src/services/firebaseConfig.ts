import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config';

// Check if the provided config is valid or just the placeholder.
export const isFirebaseConfigured = !!FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes('PASTE_YOUR');

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let firebaseServices: FirebaseServices | null = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const db = getFirestore(app);
    firebaseServices = { app, auth, db };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
    console.warn("Firebase is not configured. Login and commenting features will be disabled. Please check your src/config.ts file.");
}


/**
 * Provides access to the initialized Firebase services.
 * Returns null if Firebase is not configured or initialization failed.
 */
export const getFirebaseServices = (): FirebaseServices | null => {
  return firebaseServices;
};