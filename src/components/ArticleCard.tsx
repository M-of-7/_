import React from 'react';
import type { Article } from '../types';
import { UI_TEXT } from '../constants';
import TrendingUpIcon from './icons/TrendingUpIcon';

interface ArticleCardProps {
  article: Article;
  onReadMore: (article: Article) => void;
  categoryText: string;
  uiText: typeof UI_TEXT['en'];
  isFeatured?: boolean;
}

const getViralityStyle = (description: string): { color: string; key: 'fast_spreading' | 'medium_spreading' | 'low_spreading' } => {
    if (description === 'Fast Spreading' || description === 'سريع الانتشار') return { color: 'text-red-600', key: 'fast_spreading' };
    if (description === 'Medium Spreading' || description === 'متوسط الانتشار') return { color: 'text-orange-500', key: 'medium_spreading' };
    return { color: 'text-stone-500', key: 'low_spreading' };
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, categoryText, uiText, isFeatured = false }) => {
  const bodySnippet = article.body ? article.body.split('\n')[0].substring(0, isFeatured ? 200 : 100) + '...' : '';
  const { color: viralityColorClass, key: viralityKey } = getViralityStyle(article.viralityDescription || '');
  const viralityDisplayText = uiText[viralityKey] || article.viralityDescription;
  const isRTL = document.documentElement.dir === 'rtl';

  const cardClasses = `
    ${isFeatured ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : 'col-span-1'}
    bg-white flex flex-col cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300 shadow-md hover:shadow-xl rounded-lg overflow-hidden
  `;

  return (
    <div 
      className={cardClasses}
      onClick={() => onReadMore(article)}
      role="article"
      aria-labelledby={`headline-${article.id}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        {article.imageUrl ? (
            <>
                <img 
                  src={article.imageUrl} 
                  alt={article.headline} 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width="1280"
                  height="720"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </>
        ) : (
            <div className="h-full w-full bg-stone-200 animate-pulse"></div>
        )}
        <span className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-red-700 text-white text-[10px] font-bold uppercase px-2 py-1 rounded z-10">
          {categoryText}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h2 
            id={`headline-${article.id}`}
            className={`font-bold text-stone-900 ${isFeatured ? 'text-2xl' : 'text-xl'} ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}
        >
            {article.headline}
        </h2>
        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 mb-2">
          <span>{article.byline} - {article.date}</span>
          <div title={uiText.virality_tooltip} className={`flex items-center gap-1 font-bold ${viralityColorClass}`}>
            <TrendingUpIcon className="w-4 h-4" color="currentColor" />
            <span>{viralityDisplayText}</span>
          </div>
        </div>
        <p className="text-sm text-stone-600 flex-grow">{bodySnippet}</p>
        <span className="text-red-700 font-bold mt-4 self-start group-hover:underline">
          {isRTL ? 'اقرأ المزيد ←' : 'Read More →'}
        </span>
      </div>
    </div>
  );
};

export default ArticleCard;