import React from 'react';
import type { User } from 'firebase/auth';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';

interface HeaderProps {
  title: string;
  subtitle: string;
  language: Language;
  toggleLanguage: () => void;
  languageToggleText: string;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onMessagingClick: () => void;
  onDiagnosticsClick: () => void;
  uiText: typeof UI_TEXT['en'];
}

const Header: React.FC<HeaderProps> = (props) => {
  const { title, subtitle, language, toggleLanguage, languageToggleText, onRefresh, searchQuery, setSearchQuery, user, onLogin, onLogout, onMessagingClick, onDiagnosticsClick, uiText } = props;

  return (
    <header className="bg-gradient-to-r from-stone-900 to-black text-white p-6 shadow-2xl relative overflow-hidden">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-bold font-header-en tracking-tighter">{title}</h1>
            <p className="text-stone-300 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleLanguage} className="font-semibold hover:text-stone-300 transition-colors">{languageToggleText}</button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-white" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  <a href="#" onClick={(e) => { e.preventDefault(); onMessagingClick(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Messages</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{uiText.logout}</a>
                </div>
              </div>
            ) : (
              <button onClick={onLogin} className="px-4 py-2 bg-white text-black font-bold rounded-md hover:bg-stone-200 transition-colors">{uiText.login}</button>
            )}
             <button onClick={onDiagnosticsClick} title="Run System Diagnostics" className="font-semibold hover:text-stone-300 transition-colors text-xl">⚙️</button>
          </div>
        </div>
        <div className="mt-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={uiText.search_placeholder}
            className="w-full p-3 bg-stone-800 border-2 border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
