import { createClient } from '@supabase/supabase-js';
import { authService } from './authService';

// Consistent Supabase client initialization
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Error initializing Supabase client for messaging:", error);
  }
}

// Type Definitions
export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend?: Profile;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  articleId?: string;
  isRead: boolean;
  createdAt: string;
}

const getCurrentUserId = (): string | null => {
  const user = authService.getAuth().currentUser;
  return user ? user.uid : null;
};

const getFriends = async (): Promise<Friendship[]> => {
  if (!supabase) throw new Error('Supabase not configured for messaging.');
  const userId = getCurrentUserId();
  if (!userId) return [];

  // This is a mocked response as we don't have the user's friends data.
  // A real implementation would query a 'friendships' table.
  console.warn("Messaging Service: getFriends() is returning mocked data.");
  return [
    { id: '1', userId: userId, friendId: 'friend1', friend: { id: 'friend1', username: 'ai_buddy', displayName: 'AI Buddy' } },
    { id: '2', userId: userId, friendId: 'friend2', friend: { id: 'friend2', username: 'news_fan', displayName: 'Newshound' } }
  ];
};

const getMessages = async (friendId: string): Promise<Message[]> => {
  if (!supabase) throw new Error('Supabase not configured for messaging.');
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  // A real implementation would query the 'messages' table.
  console.warn("Messaging Service: getMessages() is returning mocked data.");
  return [
      { id: 'msg1', senderId: friendId, receiverId: userId, content: 'Hey, have you seen the latest tech news?', isRead: true, createdAt: new Date(Date.now() - 60000 * 5).toISOString() },
      { id: 'msg2', senderId: userId, receiverId: friendId, content: 'Not yet, anything interesting?', isRead: true, createdAt: new Date(Date.now() - 60000 * 4).toISOString() },
  ];
};

const sendMessage = async (receiverId: string, content: string, articleId?: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured for messaging.');
  const senderId = getCurrentUserId();
  if (!senderId) throw new Error('User not logged in');

  console.log(`Simulating sending message to ${receiverId}:`, { content, articleId });
  // A real implementation would insert into the 'messages' table.
  // const { error } = await supabase.from('messages').insert({ ... });
  return Promise.resolve();
};

const markAsRead = async (messageIds: string[]): Promise<void> => {
    if (!supabase || messageIds.length === 0) return;
    console.log("Simulating marking messages as read:", messageIds);
    // A real implementation would update the 'messages' table.
    // const { error } = await supabase.from('messages').update({ is_read: true }).in('id', messageIds);
    return Promise.resolve();
};

const subscribeToMessages = (friendId: string, onNewMessage: (message: Message) => void): (() => void) => {
    if (!supabase) return () => {};
    console.warn("Messaging Service: subscribeToMessages() is not implemented with real-time updates.");
    // A real implementation would use Supabase Realtime channels.
    // const channel = supabase.channel(...).on(...).subscribe();
    // return () => supabase.removeChannel(channel);
    return () => {}; // Return an empty unsubscribe function
};


export const messagingService = {
  getFriends,
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
};
