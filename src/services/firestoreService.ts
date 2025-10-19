import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';
import type { Article, Comment, Language } from '../types';

const services = getFirebaseServices();
const db = services?.db;

const articlesCollection = db ? collection(db, 'articles') : null;

const addCommentToArticle = async (articleId: string, comment: Comment) => {
  if (!articlesCollection) {
    console.warn("Firestore is disabled; comment not saved.");
    return;
  }
  const articleRef = doc(articlesCollection, articleId);
  try {
    // Note: This assumes the article document already exists.
    await updateDoc(articleRef, {
      comments: arrayUnion(comment)
    });
  } catch (error) {
    console.error("Error adding comment to Firestore:", error);
  }
};

const getArticlesForDay = async (date: string, language: Language): Promise<Article[] | null> => {
    if (!articlesCollection) return null;
    
    try {
        // Firestore doesn't support querying on parts of an ISO string well with inequalities.
        // A robust way is to store just the 'YYYY-MM-DD' date for querying.
        // For now, we'll query for the start of the given day.
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const q = query(articlesCollection, 
            where("date", ">=", startOfDay.toISOString()), 
            where("date", "<=", endOfDay.toISOString())
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log(`Cache miss for ${date} (${language})`);
            return null;
        }

        const articles = querySnapshot.docs.map(doc => doc.data() as Article);
        // Additional client-side filter if language is a field, though it's better to model this in Firestore.
        console.log(`Cache hit for ${date} (${language})`);
        return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
        console.error("Error fetching day from Firestore:", error);
        return null;
    }
};

const syncArticlesBatch = async (articles: Article[]) => {
    if (!db || !articlesCollection || articles.length === 0) return;
    const batch = writeBatch(db);
    articles.forEach(article => {
        const articleRef = doc(articlesCollection, article.id);
        // Use set with merge to create or update articles without overwriting existing fields unintentionally.
        batch.set(articleRef, article, { merge: true });
    });
    try {
        await batch.commit();
        console.log(`Synced batch of ${articles.length} articles to Firestore.`);
    } catch(e) {
        console.error("Error syncing article batch:", e);
    }
}

const syncArticle = async (article: Article) => {
    if (!articlesCollection) return;
    try {
        const articleRef = doc(articlesCollection, article.id);
        await setDoc(articleRef, article, { merge: true });
        console.log(`Synced article ${article.id} to Firestore.`);
    } catch (error) {
        console.error(`Error syncing article ${article.id}:`, error);
    }
}

export const firestoreService = {
    addCommentToArticle,
    getArticlesForDay,
    syncArticle,
    syncArticlesBatch
};