// Fix: Import SupabaseClient to use for typing the client instance.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authService } from './authService';

// Fix: Add database schema types for Supabase client.
// This provides type-safety and fixes the 'insert' method errors.
export interface Database {
  public: {
    Tables: {
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          article_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          article_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          article_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Fix: Use the generic `SupabaseClient<Database>` type for the supabase instance.
let supabase: SupabaseClient<Database> | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    // Fix: Pass the Database type to createClient to get a typed client.
    supabase = createClient<Database>(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Error initializing Supabase client for messaging:", error);
  }
}

// Type Definitions
export interface Profile {
  id: string; // This is the user's UUID from auth.users
  username: string;
  display_name: string;
}

// For UI consistency, we rename fields on the fly
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend?: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  articleId?: string | null;
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

  const { data, error } = await supabase
    .from('friendships')
    .select('id, friend_id, profiles:friend_id(id, username, display_name)')
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
  
  return data.map((item: any) => ({
      id: item.id,
      userId: userId,
      friendId: item.friend_id,
      friend: {
          id: item.profiles.id,
          username: item.profiles.username,
          displayName: item.profiles.display_name
      }
  }));
};

const searchUsers = async (query: string): Promise<Profile[]> => {
    if (!supabase) throw new Error("Supabase not configured.");
    const userId = getCurrentUserId();
    if (!userId) return [];

    const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId);

    if (friendsError) {
        console.error("Error fetching friend IDs for search exclusion:", friendsError);
        return [];
    }

    const friendIds = (friendsData as any[])?.map(f => f.friend_id) ?? [];
    const excludeIds = [userId, ...friendIds];

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(10);
        
    if (error) {
        console.error("Error searching users:", error);
        return [];
    }

    return data.map((p: any) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name
    }));
}

const addFriend = async (friendId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured.');
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not logged in');
    if (userId === friendId) throw new Error("Cannot add yourself as a friend.");

    // Fix: Explicitly type the insert payload to help TypeScript resolve the correct insert overload.
    // Add friendship in both directions for easy querying
    const friendshipsToInsert: Database['public']['Tables']['friendships']['Insert'][] = [
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId } 
    ];
    const { error } = await supabase.from('friendships').insert(friendshipsToInsert);

    if (error) {
        console.error("Error adding friend:", error);
        throw error;
    }
}


const getMessages = async (friendId: string): Promise<Message[]> => {
    if (!supabase) throw new Error('Supabase not configured.');
    const userId = getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${userId},receiver_id.eq.${friendId}),(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
    return data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        articleId: m.article_id,
        isRead: m.is_read,
        createdAt: m.created_at,
    }));
};


const sendMessage = async (receiverId: string, content: string, articleId?: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured for messaging.');
  const senderId = getCurrentUserId();
  if (!senderId) throw new Error('User not logged in');

  // Fix: Explicitly type the insert payload and handle optional articleId to help TypeScript resolve the correct insert overload.
  const messageData: Database['public']['Tables']['messages']['Insert'] = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: content,
  };

  if (articleId) {
    messageData.article_id = articleId;
  }

  const { error } = await supabase.from('messages').insert(messageData);

  if (error) {
      console.error("Error sending message:", error);
      throw error;
  }
};

const subscribeToMessages = (friendId: string, onNewMessage: (message: Message) => void): (() => void) => {
    if (!supabase) return () => {};
    const userId = getCurrentUserId();

    const channel = supabase.channel(`messages-${userId}-${friendId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}`
        }, (payload) => {
            const newMessage = payload.new as any;
            if (newMessage.sender_id === friendId) {
                onNewMessage({
                    id: newMessage.id,
                    senderId: newMessage.sender_id,
                    receiverId: newMessage.receiver_id,
                    content: newMessage.content,
                    articleId: newMessage.article_id,
                    isRead: newMessage.is_read,
                    createdAt: newMessage.created_at,
                });
            }
        })
        .subscribe();

    return () => { supabase.removeChannel(channel) };
};

export const messagingService = {
  getFriends,
  getMessages,
  sendMessage,
  subscribeToMessages,
  searchUsers,
  addFriend,
};