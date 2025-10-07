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

  if (!article) return null;

  const { color: viralityColorClass, key: viralityKey } = getViralityStyle(article.viralityDescription);
  const viralityDisplayText = uiText[viralityKey] || article.viralityDescription;


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-headline-${article.id}`}
    >
      <div 
        className="bg-stone-100 rounded-lg shadow-2xl max-w-4xl w-11/12 h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-20 p-1 bg-white/70 rounded-full hover:bg-white transition-colors" aria-label="Close article">
          <svg className="w-6 h-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-shrink-0">
            {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.headline} className="w-full h-64 object-cover rounded-t-lg" />
            ) : (
                <div className="w-full h-64 bg-stone-200 animate-pulse rounded-t-lg"></div>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <h1 id={`modal-headline-${article.id}`} className={`text-3xl lg:text-4xl font-bold text-stone-900 mb-2 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{article.headline}</h1>
          <div className="flex items-center mb-6 gap-3 text-stone-600">
            <span>{article.byline} &bull; {article.date}</span>
            <div title={uiText.virality_tooltip} className={`flex items-center gap-1 font-bold ${viralityColorClass}`}>
              <TrendingUpIcon className="w-5 h-5" color="currentColor" />
              <span>{viralityDisplayText}</span>
            </div>
          </div>
          
          <div className="prose max-w-none text-lg text-stone-800 leading-relaxed">
            {article.body.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>

          {article.sources && article.sources.length > 0 && (
            <div className="mt-8 pt-4 border-t border-stone-300">
                <h3 className={`text-xl font-bold text-stone-800 mb-2 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{uiText.sources}</h3>
                <ul className="list-disc list-inside space-y-1">
                    {article.sources.map((source, index) => (
                        <li key={index}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">
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