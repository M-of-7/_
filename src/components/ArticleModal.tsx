import React, { useMemo, useEffect } from 'react';
import type { Article, Language } from '../types';
import ShareButtons from './ShareButtons';
import { UI_TEXT } from '../constants';
import TrendingUpIcon from './icons/TrendingUpIcon';
import CommentSection from './CommentSection';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  language: Language;
  isLoggedIn: boolean;
  onAddComment: (articleId: string, commentText: string) => void;
}

const getViralityStyle = (description: string): { color: string; key: 'fast_spreading' | 'medium_spreading' | 'low_spreading' } => {
    if (description === 'Fast Spreading' || description === 'سريع الانتشار') return { color: 'text-red-600', key: 'fast_spreading' };
    if (description === 'Medium Spreading' || description === 'متوسط الانتشار') return { color: 'text-orange-500', key: 'medium_spreading' };
    return { color: 'text-stone-500', key: 'low_spreading' };
};

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, language, isLoggedIn, onAddComment }) => {
  const uiText = useMemo(() => UI_TEXT[language], [language]);
  const isRTL = language === 'ar';

  useEffect(() => {
    const body = document.body;
    if (article) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [article, onClose]);
  
  const formattedDate = useMemo(() => {
    if (!article?.date) return '';
    const date = new Date(article.date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', options).format(date);
  }, [article?.date, language]);

  if (!article) return null;

  const { color: viralityColorClass, key: viralityKey } = getViralityStyle(article.viralityDescription || '');
  const viralityDisplayText = uiText[viralityKey] || article.viralityDescription;


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-headline-${article.id}`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-11/12 h-[92vh] flex flex-col border-2 border-stone-200 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2 bg-red-700 text-white rounded-full hover:bg-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110" aria-label="Close article">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-shrink-0">
            {article.imageUrl ? (
                <picture>
                  <source srcSet={article.imageUrl.replace(/\.png$/i, '.webp')} type="image/webp" />
                  <img 
                    src={article.imageUrl} 
                    alt={article.headline} 
                    className="w-full h-64 object-cover rounded-t-lg" 
                    loading="lazy"
                    width="1280"
                    height="720"
                  />
                </picture>
            ) : (
                <div className="w-full h-64 bg-stone-200 animate-pulse rounded-t-lg"></div>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gradient-to-b from-white to-stone-50">
          <h1 id={`modal-headline-${article.id}`} className={`text-4xl lg:text-5xl font-black text-stone-900 mb-4 leading-tight ${isRTL ? 'font-header-ar' : 'font-header-en'}`}>{article.headline}</h1>
          <div className="flex items-center mb-8 gap-4 text-stone-700 text-sm">
            <span className="font-semibold">{article.byline} &bull; {formattedDate}</span>
            <div title={uiText.virality_tooltip} className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full bg-opacity-10 ${viralityColorClass} ${viralityColorClass.replace('text-', 'bg-')}`}>
              <TrendingUpIcon className="w-5 h-5" color="currentColor" />
              <span>{viralityDisplayText}</span>
            </div>
          </div>
          
          <div className="prose max-w-none text-lg text-stone-900 leading-relaxed space-y-4">
            {article.body && article.body.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index} className="text-justify">{paragraph}</p>
            ))}
          </div>

          {article.sources && article.sources.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-stone-300">
                <h3 className={`text-2xl font-bold text-stone-900 mb-4 ${isRTL ? 'font-header-ar' : 'font-header-en'}`}>{uiText.sources}</h3>
                <ul className="list-disc list-inside space-y-2">
                    {article.sources.map((source, index) => (
                        <li key={index}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:text-red-900 hover:underline font-semibold transition-colors">
                                {source.title || source.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
          )}

          <ShareButtons article={article} uiText={uiText} />
          
          <CommentSection 
            articleId={article.id}
            comments={article.comments}
            isLoggedIn={isLoggedIn}
            onAddComment={onAddComment}
            uiText={uiText}
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
