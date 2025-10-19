import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  friend?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  article_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export const messagingService = {
  async createProfile(userId: string, username: string, displayName: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data as Profile[];
  },

  async sendFriendRequest(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(friendshipId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:friend_id(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) throw error;
    return data as Friendship[];
  },

  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:user_id(*)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return data as Friendship[];
  },

  async sendMessage(receiverId: string, content: string, articleId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        article_id: articleId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(*)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  async markAsRead(messageIds: string[]) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  },

  async subscribeToMessages(friendId: string, callback: (message: Message) => void) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.sender_id === friendId) {
            callback(payload.new as Message);
          }
        }
      )
      .subscribe();

    return subscription;
  },
};
