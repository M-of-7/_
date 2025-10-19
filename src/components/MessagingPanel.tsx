import React, { useState, useEffect, useRef } from 'react';
import { messagingService, type Message, type Friendship } from '../services/messagingService';
import type { Article } from '../types';

interface MessagingPanelProps {
  article?: Article;
  onClose: () => void;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ article, onClose }) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend);
      const subscription = messagingService.subscribeToMessages(selectedFriend, (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      return () => {
        subscription();
      };
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriends = async () => {
    try {
      const data = await messagingService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(friendId);
      setMessages(data);

      const unreadIds = data
        .filter((m) => !m.is_read && m.receiver_id !== friendId)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await messagingService.markAsRead(unreadIds);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const content = article
        ? `شارك معك خبر: "${article.headline}"\n\n${newMessage}`
        : newMessage;

      await messagingService.sendMessage(
        selectedFriend,
        content,
        article?.id
      );

      setNewMessage('');
      await loadMessages(selectedFriend);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectedFriendData = friends.find((f) => f.friend_id === selectedFriend);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        {/* Friends List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
            <h3 className="font-bold text-white">الأصدقاء / Friends</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-200 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {friends.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                لا يوجد أصدقاء بعد
                <br />
                No friends yet
              </div>
            ) : (
              friends.map((friendship) => (
                <button
                  key={friendship.id}
                  onClick={() => setSelectedFriend(friendship.friend_id)}
                  className={`w-full p-4 text-right hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    selectedFriend === friendship.friend_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-semibold text-slate-800">
                    {friendship.friend?.display_name}
                  </div>
                  <div className="text-sm text-slate-500">
                    @{friendship.friend?.username}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-800">
                  {selectedFriendData?.friend?.display_name}
                </div>
                <div className="text-sm text-slate-500">
                  @{selectedFriendData?.friend?.username}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="text-center text-slate-500">جاري التحميل...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500">
                    ابدأ المحادثة!
                    <br />
                    Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSent = message.sender_id !== selectedFriend;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isSent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isSent ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Article Preview */}
              {article && (
                <div className="px-4 py-2 border-t border-slate-200 bg-blue-50">
                  <div className="text-xs text-slate-600 mb-1">
                    سيتم مشاركة هذا الخبر:
                  </div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {article.headline}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="اكتب رسالة... / Type a message..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              اختر صديقاً للمحادثة
              <br />
              Select a friend to chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPanel;
