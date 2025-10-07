import React from 'react';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { Language } from '../src/types';
import SearchIcon from './icons/SearchIcon';
import RefreshIcon from './icons/RefreshIcon';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { User } from '../src/services/authService';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import { APP_VERSION } from '../src/constants';

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
  uiText: {
    search_placeholder: string;
    refresh_tooltip: string;
    account_tooltip: string;
    login: string;
    logout: string;
  };
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  language, 
  toggleLanguage, 
  languageToggleText,
  onRefresh,
  searchQuery,
  setSearchQuery,
  user,
  onLogin,
  onLogout,
  uiText
}) => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', options).format(today);
  const isRTL = language === 'ar';

  return (
    <header className="bg-stone-100 p-3 lg:p-4 border-b-2 border-stone-200">
      <div className="flex justify-between items-center">
        <div className="flex-1 flex items-center gap-4">
          <button 
            onClick={onRefresh} 
            title={uiText.refresh_tooltip} 
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <RefreshIcon className="w-5 h-5 text-stone-700" />
          </button>
          <div className="relative flex-grow max-w-sm">
            <input
              type="search"
              placeholder={uiText.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-100 border border-stone-300 rounded-full py-1.5 px-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto">
              <SearchIcon className="w-4 h-4 text-stone-500" />
            </div>
          </div>
        </div>
        
        <div className="flex-1.5 text-center px-4">
          <h1 className={`text-3xl lg:text-4xl font-black tracking-wider text-stone-900 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{title}</h1>
          <p className={`text-xs mt-1 text-stone-600 ${isRTL ? 'font-serif-ar' : 'font-serif-en'}`}>{subtitle}</p>
        </div>

        <div className="flex-1 flex items-center justify-end gap-4">
          <button onClick={user ? onLogout : onLogin} className="bg-stone-800 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-stone-900 transition-colors">
            {user ? uiText.logout : uiText.login}
          </button>
          <button onClick={toggleLanguage} className="border-2 border-stone-800 text-stone-800 px-3 py-1 rounded-md text-sm font-bold hover:bg-stone-800 hover:text-white transition-colors">
            {languageToggleText}
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 border-t-4 border-b-2 border-stone-900 border-double py-2">
        <span className="text-xs font-bold text-stone-900">{formattedDate}</span>
        <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-stone-500">v{APP_VERSION}</span>
            <span className="text-xs font-bold text-stone-900">VOL. 1, NO. 1</span>
        </div>
      </div>
    </header>
  );
};

export default Header;