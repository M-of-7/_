import React from 'react';
import type { Article } from '../types';
import { UI_TEXT } from '../constants';

interface ArticleCardProps {
  article: Article;
  onReadMore: (article: Article) => void;
  categoryText: string;
  uiText: typeof UI_TEXT['en'];
  isFeatured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, categoryText, uiText, isFeatured = false }) => {
  const isRTL = uiText.language_toggle === 'English';
  const fontClass = isRTL ? 'font-serif-ar' : 'font-serif-en';
  const headerFontClass = isRTL ? 'font-serif-ar' : 'font-header-en';

  if (isFeatured) {
    return (
      <div onClick={() => onReadMore(article)} className={`bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row h-full group cursor-pointer border border-transparent hover:border-blue-500`}>
        <div className="relative md:w-1/2">
          <img src={article.imageUrl} alt={article.headline} className="w-full h-64 md:h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">{categoryText}</span>
        </div>
        <div className={`p-6 flex flex-col flex-grow md:w-1/2`}>
          <div>
            <h3 className={`font-bold text-3xl lg:text-4xl leading-tight text-stone-900 group-hover:text-blue-700 transition-colors ${headerFontClass}`}>{article.headline}</h3>
            <p className={`mt-4 text-stone-600 text-lg leading-relaxed line-clamp-4 ${fontClass}`}>{article.body}</p>
          </div>
          <div className="mt-auto pt-4 flex justify-between items-center">
            <div className="text-sm text-stone-500">
              <p className="font-semibold">{uiText.by} {article.byline}</p>
              <p>{new Date(article.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onReadMore(article)} className={`bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full group cursor-pointer border border-transparent hover:border-blue-500`}>
      <div className="relative">
        <img src={article.imageUrl} alt={article.headline} className="w-full h-52 object-cover transform group-hover:scale-105 transition-transform duration-300" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
         <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold uppercase px-2 py-1 rounded-full">{categoryText}</span>
      </div>
      <div className={`p-5 flex flex-col flex-grow`}>
        <div>
          <h3 className={`font-bold text-xl leading-tight text-stone-900 group-hover:text-blue-700 transition-colors ${headerFontClass}`}>{article.headline}</h3>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center text-xs text-stone-500">
          <p className="font-semibold">{uiText.by} {article.byline}</p>
          <p>{new Date(article.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}</p>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
