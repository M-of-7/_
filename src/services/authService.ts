import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseServices, isFirebaseConfigured } from './firebaseConfig';

// Define a local User type to decouple it from Firebase-specific types in the UI.
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

const services = getFirebaseServices();
const auth = services?.auth;

const login = async () => {
  if (!auth) {
    const errorMsg = "Firebase Auth is not available; login unavailable.";
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Error during sign-in:", error);

    // Handle unauthorized domain error
    if (error?.code === 'auth/unauthorized-domain') {
      const hostingDomain = window.location.hostname;
      throw new Error(
        `Domain "${hostingDomain}" is not authorized. ` +
        `To fix this:\n` +
        `1. Go to Firebase Console → Authentication → Settings\n` +
        `2. Add "${hostingDomain}" to "Authorized domains"\n` +
        `3. Save and try again`
      );
    }

    throw error;
  }
};

const logout = async () => {
  if (!auth) {
    console.warn("Firebase Auth is not available; logout unavailable.");
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
};

const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // Always report user as logged out if Firebase isn't configured.
    callback(null);
    return () => {}; // Return an empty unsubscribe function.
  }
  
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const { uid, displayName, email, photoURL } = firebaseUser;
      callback({ uid, displayName, email, photoURL });
    } else {
      callback(null);
    }
  });
};

export const authService = {
  login,
  logout,
  onAuthChange,
  isConfigured: isFirebaseConfigured,
};