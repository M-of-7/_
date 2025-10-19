import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  or,
  and,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  friend?: Profile;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  articleId?: string;
  isRead: boolean;
  createdAt: Date;
  sender?: Profile;
}

const getDb = () => {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase not configured');
  return services.db;
};

const getCurrentUserId = () => {
  const services = getFirebaseServices();
  if (!services?.auth.currentUser) throw new Error('Not authenticated');
  return services.auth.currentUser.uid;
};

export const messagingService = {
  async createProfile(userId: string, username: string, displayName: string) {
    const db = getDb();
    const profileRef = doc(db, 'profiles', userId);
    const profileData = {
      username,
      displayName,
      avatarUrl: '',
      bio: '',
      createdAt: serverTimestamp(),
    };
    await updateDoc(profileRef, profileData).catch(async () => {
      await addDoc(collection(db, 'profiles'), { ...profileData, id: userId });
    });
    return { id: userId, ...profileData, createdAt: new Date() };
  },

  async getProfile(userId: string) {
    const db = getDb();
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) throw new Error('Profile not found');
    return { id: profileSnap.id, ...profileSnap.data() } as Profile;
  },

  async searchUsers(searchQuery: string) {
    const db = getDb();
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef);
    const snapshot = await getDocs(q);
    const results: Profile[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Profile;
      const lowerQuery = searchQuery.toLowerCase();
      if (
        data.username?.toLowerCase().includes(lowerQuery) ||
        data.displayName?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ id: doc.id, ...data });
      }
    });
    return results.slice(0, 10);
  },

  async sendFriendRequest(friendId: string) {
    const db = getDb();
    const userId = getCurrentUserId();
    const friendshipsRef = collection(db, 'friendships');
    const data = {
      userId,
      friendId,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(friendshipsRef, data);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },

  async acceptFriendRequest(friendshipId: string) {
    const db = getDb();
    const friendshipRef = doc(db, 'friendships', friendshipId);
    await updateDoc(friendshipRef, { status: 'accepted' });
    const snapshot = await getDoc(friendshipRef);
    return { id: snapshot.id, ...snapshot.data() } as Friendship;
  },

  async getFriends() {
    const db = getDb();
    const userId = getCurrentUserId();
    const friendshipsRef = collection(db, 'friendships');
    const q = query(
      friendshipsRef,
      where('userId', '==', userId),
      where('status', '==', 'accepted')
    );
    const snapshot = await getDocs(q);
    const friendships: Friendship[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const friend = await this.getProfile(data.friendId).catch(() => null);
      friendships.push({
        id: docSnap.id,
        ...data,
        friend,
      } as Friendship);
    }

    return friendships;
  },

  async getPendingRequests() {
    const db = getDb();
    const userId = getCurrentUserId();
    const friendshipsRef = collection(db, 'friendships');
    const q = query(
      friendshipsRef,
      where('friendId', '==', userId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    const requests: Friendship[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const friend = await this.getProfile(data.userId).catch(() => null);
      requests.push({
        id: docSnap.id,
        ...data,
        friend,
      } as Friendship);
    }

    return requests;
  },

  async sendMessage(receiverId: string, content: string, articleId?: string) {
    const db = getDb();
    const senderId = getCurrentUserId();
    const messagesRef = collection(db, 'messages');
    const data = {
      senderId,
      receiverId,
      content,
      articleId: articleId || null,
      isRead: false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(messagesRef, data);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },

  async getMessages(friendId: string) {
    const db = getDb();
    const userId = getCurrentUserId();
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      or(
        and(where('senderId', '==', userId), where('receiverId', '==', friendId)),
        and(where('senderId', '==', friendId), where('receiverId', '==', userId))
      ),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Message);
    }

    return messages;
  },

  async markAsRead(messageIds: string[]) {
    const db = getDb();
    for (const id of messageIds) {
      const messageRef = doc(db, 'messages', id);
      await updateDoc(messageRef, { isRead: true });
    }
  },

  subscribeToMessages(friendId: string, callback: (message: Message) => void): Unsubscribe {
    const db = getDb();
    const userId = getCurrentUserId();
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', friendId),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          callback({
            id: change.doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Message);
        }
      });
    });
  },
};
