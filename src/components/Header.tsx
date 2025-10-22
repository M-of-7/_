import React from 'react';
import type { User } from 'firebase/auth';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';
import PaperPlaneIcon from './icons/PaperPlaneIcon';

interface HeaderProps {
  title: string;
  subtitle: string;
  language: Language;
  toggleLanguage: () => void;
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
  const { title, subtitle, language, toggleLanguage, searchQuery, setSearchQuery, user, onLogin, onLogout, onMessagingClick, onDiagnosticsClick, uiText } = props;
  const isRTL = language === 'ar';

  return (
    <header className="bg-white text-stone-800 p-4 shadow-md border-b-4 border-stone-800">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Left Section */}
          <div className="flex-1 flex items-center gap-2 justify-start min-w-0">
            <button onClick={toggleLanguage} className="font-semibold text-stone-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md text-sm">
              {isRTL ? 'English' : 'العربية'}
            </button>
            {user && (
              <div className="relative group hidden sm:block">
                <button className="flex items-center space-x-2">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0d8abc&color=fff`} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-stone-200 group-hover:border-blue-500 transition-colors" />
                </button>
                <div className={`absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 ${isRTL ? 'right-0' : 'left-0'}`}>
                  <a href="#" onClick={(e) => { e.preventDefault(); onDiagnosticsClick(); }} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'التشخيصات' : 'Diagnostics'}
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>{uiText.logout}</a>
                </div>
              </div>
            )}
          </div>

          {/* Center Section */}
          <div className="flex-shrink-0 text-center px-4">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{title}</h1>
            <p className="text-stone-500 mt-1 text-xs sm:text-sm">{subtitle}</p>
          </div>
          
          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end min-w-0">
            {user ? (
              <button 
                onClick={onMessagingClick} 
                className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                title={isRTL ? 'الرسائل' : 'Messages'}
              >
                <PaperPlaneIcon className="w-5 h-5 text-stone-600" />
              </button>
            ) : (
              <button onClick={onLogin} className="px-5 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-black transition-colors text-sm">{uiText.login}</button>
            )}
          </div>
        </div>
        <div className="mt-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={uiText.search_placeholder}
            className="w-full p-3 bg-stone-100 border-2 border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
