import React, { useState, useEffect, useRef } from 'react';
import { messagingService, type Message, type Friendship, type Profile } from '../services/messagingService';
import type { Article } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import { UI_TEXT } from '../constants';

interface MessagingPanelProps {
  article?: Article;
  onClose: () => void;
  uiText: typeof UI_TEXT['en'];
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ article, onClose, uiText }) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }
    if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        searchTimeoutRef.current = window.setTimeout(async () => {
            const results = await messagingService.searchUsers(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
        }, 500); // Debounce search
    } else {
        setSearchResults([]);
        setIsSearching(false);
    }
    return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
}, [searchQuery]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(friendId);
      setMessages(data);
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
        ? `Check out this story: "${article.headline}"\n\n${newMessage}`
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

  const handleAddFriend = async (friendId: string) => {
    try {
        await messagingService.addFriend(friendId);
        setSearchQuery(''); // Clear search
        setSearchResults([]); // Clear results
        await loadFriends(); // Refresh friends list
        setSelectedFriend(friendId); // Select the new friend
    } catch (error) {
        console.error('Error adding friend:', error);
    }
  }

  const selectedFriendData = friends.find((f) => f.friendId === selectedFriend);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        {/* Friends List & Search */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-700 to-slate-800">
            <h3 className="font-bold text-white">{uiText.messaging_panel_title}</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-200 text-2xl"
            >
              ×
            </button>
          </div>
           <div className="p-2 border-b border-slate-200">
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={uiText.messaging_search_placeholder}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
          <div className="flex-1 overflow-y-auto">
            {isSearching ? <div className="p-4 text-center"><SpinnerIcon className="w-6 h-6 mx-auto text-slate-400" /></div> : null}

            {searchQuery.length > 2 && searchResults.length > 0 && (
                <div>
                    {searchResults.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100">
                            <div>
                                <div className="font-semibold text-slate-800">{profile.display_name}</div>
                                <div className="text-sm text-slate-500">@{profile.username}</div>
                            </div>
                            <button onClick={() => handleAddFriend(profile.id)} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700">{uiText.messaging_add_friend}</button>
                        </div>
                    ))}
                </div>
            )}
             {searchQuery.length <= 2 && (
                loading ? <div className="p-4 text-center"><SpinnerIcon className="w-6 h-6 mx-auto text-slate-400" /></div> :
                friends.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                    {uiText.messaging_no_friends}
                </div>
                ) : (
                friends.map((friendship) => (
                    <button
                    key={friendship.id}
                    onClick={() => setSelectedFriend(friendship.friendId)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        selectedFriend === friendship.friendId ? 'bg-blue-50' : ''
                    }`}
                    >
                    <div className="font-semibold text-slate-800">
                        {friendship.friend?.displayName}
                    </div>
                    <div className="text-sm text-slate-500">
                        @{friendship.friend?.username}
                    </div>
                    </button>
                ))
                )
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
                  {selectedFriendData?.friend?.displayName}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="text-center text-slate-500">{uiText.messaging_loading}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500">
                    {uiText.messaging_start_conversation}
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSent = message.senderId !== selectedFriend;
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
                            {new Date(message.createdAt).toLocaleTimeString('en-US', {
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
              {article && (
                <div className="px-4 py-2 border-t border-slate-200 bg-blue-50">
                  <div className="text-xs text-slate-600 mb-1">
                    {uiText.messaging_sharing_article}
                  </div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {article.headline}
                  </div>
                </div>
              )}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={uiText.messaging_type_message}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {uiText.messaging_send}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-center whitespace-pre-wrap">
              {uiText.messaging_select_friend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPanel;