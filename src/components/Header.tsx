import React from 'react';
import type { User } from 'firebase/auth';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';

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
    <header className="bg-white text-stone-800 p-4 sm:p-6 shadow-md border-b-4 border-stone-800">
      <div className="container mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="text-center sm:text-left">
            <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tighter ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{title}</h1>
            <p className="text-stone-500 mt-1 text-sm sm:text-base">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button onClick={toggleLanguage} className="font-semibold text-stone-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md text-sm">
              {isRTL ? 'English' : 'العربية'}
            </button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0d8abc&color=fff`} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-stone-200 group-hover:border-blue-500 transition-colors" />
                </button>
                <div className={`absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                  <a href="#" onClick={(e) => { e.preventDefault(); onMessagingClick(); }} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'الرسائل' : 'Messages'}
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onDiagnosticsClick(); }} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'التشخيصات' : 'Diagnostics'}
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>{uiText.logout}</a>
                </div>
              </div>
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
