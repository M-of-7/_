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
  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col h-full ${isFeatured ? 'md:flex-row' : ''}`}>
      <div className={`relative ${isFeatured ? 'md:w-1/2' : ''}`}>
        <img src={article.imageUrl} alt={article.headline} className={`w-full object-cover ${isFeatured ? 'h-full' : 'h-56'}`} />
        <div className="absolute top-0 left-0 bg-gradient-to-t from-black/50 to-transparent w-full h-full"></div>
      </div>
      <div className={`p-6 flex flex-col flex-grow ${isFeatured ? 'md:w-1/2' : ''}`}>
        <div>
          <span className="text-sm font-bold text-blue-600 uppercase">{categoryText}</span>
          <h3 className={`mt-2 font-bold ${isFeatured ? 'text-3xl lg:text-4xl' : 'text-2xl'} leading-tight text-stone-900`}>{article.headline}</h3>
          <p className="mt-2 text-stone-600 line-clamp-3">{article.body}</p>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="text-sm text-stone-500">
            <p className="font-semibold">{article.byline}</p>
            <p>{new Date(article.date).toLocaleDateString(uiText.language_toggle === 'English' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={() => onReadMore(article)} className="px-5 py-2.5 bg-gradient-to-r from-stone-800 to-black text-white rounded-lg transition-transform duration-200 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            {uiText.read_more}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
