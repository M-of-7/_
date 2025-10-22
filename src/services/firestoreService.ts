import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, arrayUnion, onSnapshot, getDoc } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config';
import type { Article, Comment } from '../types';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const addCommentToArticle = async (articleId: string, comment: Comment): Promise<void> => {
    // Note: The app currently uses optimistic updates.
    // This function is ready for a potential future backend implementation
    // where comments are stored in Firestore.
    console.log(`Simulating adding comment to article ${articleId}:`, comment);
    // const articleRef = doc(db, 'articles', articleId);
    // await updateDoc(articleRef, {
    //   comments: arrayUnion(comment),
    // });
    return Promise.resolve();
};

const getArticleById = async (articleId: string): Promise<Article | null> => {
    console.log(`Simulating fetching article ${articleId} from Firestore.`);
    // const articleRef = doc(db, 'articles', articleId);
    // const docSnap = await getDoc(articleRef);
    // if (docSnap.exists()) {
    //   return docSnap.data() as Article;
    // }
    return null;
}


export const firestoreService = {
  addCommentToArticle,
  getArticleById,
};
