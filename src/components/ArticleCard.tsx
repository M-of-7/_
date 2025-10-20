import React, { useMemo } from 'react';
import type { Article, Language } from '../types';
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

const ArticleImage: React.FC<{article: Article, isFeatured: boolean}> = ({ article, isFeatured }) => (
    <div className={`relative w-full overflow-hidden ${isFeatured ? 'md:w-1/2 h-64 md:h-auto' : 'h-48'}`}>
        {article.imageUrl ? (
            <>
                <picture>
                  <source srcSet={article.imageUrl.replace(/\.png$/i, '.webp')} type="image/webp" />
                  <img 
                      src={article.imageUrl} 
                      alt={article.headline} 
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                      width="1280"
                      height="720"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </>
        ) : (
            <div className="absolute inset-0 h-full w-full bg-stone-200 animate-pulse"></div>
        )}
    </div>
);


const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, categoryText, uiText, isFeatured = false }) => {
  const { color: viralityColorClass, key: viralityKey } = getViralityStyle(article.viralityDescription || '');
  const viralityDisplayText = uiText[viralityKey] || article.viralityDescription;
  const isRTL = document.documentElement.dir === 'rtl';
  const language = document.documentElement.lang as Language;

  const formattedDate = useMemo(() => {
    const date = new Date(article.date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', options).format(date);
  }, [article.date, language]);

  const bodySnippet = article.body ? article.body.split('\n')[0].substring(0, isFeatured ? 200 : 100) + '...' : '';

  if (isFeatured) {
    return (
        <div
            className="bg-white flex flex-col md:flex-row cursor-pointer group transform hover:-translate-y-2 transition-all duration-300 shadow-xl hover:shadow-2xl rounded-xl overflow-hidden h-full border-2 border-stone-200 hover:border-red-700 animate-fade-in"
            onClick={() => onReadMore(article)}
            role="article"
            aria-labelledby={`headline-${article.id}`}
        >
            <ArticleImage article={article} isFeatured={true} />
            <div className="p-6 flex flex-col flex-grow md:w-1/2 bg-gradient-to-br from-white to-stone-50">
                <span className="text-xs font-black uppercase text-red-700 mb-2 tracking-wider">{categoryText}</span>
                <h2
                    id={`headline-${article.id}`}
                    className={`font-bold text-stone-900 text-2xl lg:text-4xl leading-tight mb-2 ${isRTL ? 'font-header-ar' : 'font-header-en'}`}
                >
                    {article.headline}
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 mb-3">
                    <span>{article.byline} - {formattedDate}</span>
                     <div title={uiText.virality_tooltip} className={`flex items-center gap-1 font-bold ${viralityColorClass}`}>
                        <TrendingUpIcon className="w-4 h-4" color="currentColor" />
                        <span>{viralityDisplayText}</span>
                    </div>
                </div>
                <p className="text-base text-stone-700 flex-grow leading-relaxed">{bodySnippet}</p>
                <span className="text-red-700 font-bold mt-5 self-start group-hover:underline transition-all duration-200 flex items-center gap-2">
                    {isRTL ? 'اقرأ المزيد ←' : 'Read More →'}
                </span>
            </div>
      </div>
    );
  }

  // Regular Card
  return (
    <div
      className="bg-white flex flex-col cursor-pointer group transform hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl overflow-hidden h-full border border-stone-200 hover:border-red-600 animate-fade-in"
      onClick={() => onReadMore(article)}
      role="article"
      aria-labelledby={`headline-${article.id}`}
    >
        <div className="relative">
            <ArticleImage article={article} isFeatured={false} />
            <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 bg-gradient-to-r from-red-700 to-red-800 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-lg z-10">
              {categoryText}
            </span>
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <h2
                id={`headline-${article.id}`}
                className={`font-bold text-stone-900 text-xl lg:text-2xl leading-tight ${isRTL ? 'font-header-ar' : 'font-header-en'}`}
            >
                {article.headline}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 mb-2">
                <span>{article.byline} - {formattedDate}</span>
                <div title={uiText.virality_tooltip} className={`flex items-center gap-1 font-bold ${viralityColorClass}`}>
                    <TrendingUpIcon className="w-4 h-4" color="currentColor" />
                    <span>{viralityDisplayText}</span>
                </div>
            </div>
            <p className="text-sm text-stone-700 flex-grow leading-relaxed">{bodySnippet}</p>
            <span className="text-red-700 font-bold mt-4 self-start group-hover:underline transition-all duration-200">
            {isRTL ? 'اقرأ المزيد ←' : 'Read More →'}
            </span>
        </div>
    </div>
  );
};

export default ArticleCard;
