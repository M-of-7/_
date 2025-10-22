import React, { useState, useRef } from 'react';
import type { Article, Language } from '../types';
import { UI_TEXT } from '../constants';

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
  language: Language;
  isLoggedIn: boolean;
  onAddComment: (articleId: string, commentText: string) => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, language, isLoggedIn, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const uiText = UI_TEXT[language];
  const modalRef = useRef<HTMLDivElement>(null);
  const isRTL = language === 'ar';

  const handlePostComment = () => {
    if (commentText.trim()) {
      onAddComment(article.id, commentText);
      setCommentText('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  return (
    <div ref={modalRef} onClick={handleOverlayClick} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="article-title">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 id="article-title" className={`text-3xl font-bold text-stone-900 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{article.headline}</h2>
            <p className="text-stone-500 mt-1">{uiText.by} {article.byline} &middot; {new Date(article.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
          </div>
          <button onClick={onClose} aria-label={isRTL ? "إغلاق" : "Close"} className="text-3xl text-stone-400 hover:text-stone-800 transition-colors">&times;</button>
        </div>
        
        <div className="overflow-y-auto">
          <img src={article.imageUrl} alt={article.headline} className="w-full h-80 object-cover" />
          <div className="p-8 prose-lg max-w-none">
            <p className={`whitespace-pre-wrap leading-relaxed text-stone-800 ${isRTL ? 'font-serif-ar' : 'font-serif-en'}`}>{article.body}</p>
          </div>

          <div className="px-8 pb-8">
            <h3 className={`text-2xl font-bold mb-4 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{uiText.comments_title}</h3>
            <div className="space-y-4 mb-6">
              {article.comments.length > 0 ? (
                article.comments.map((comment, index) => (
                  <div key={index} className="bg-stone-100 p-4 rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-800">{comment.author}</p>
                    <p className="text-stone-700">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-stone-500">{isRTL ? 'لا توجد تعليقات بعد.' : 'No comments yet.'}</p>
              )}
            </div>
            {isLoggedIn ? (
              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={uiText.add_comment_placeholder}
                  className="w-full p-3 border border-stone-300 rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  rows={3}
                ></textarea>
                <button onClick={handlePostComment} className={`float-right px-6 py-2 bg-stone-800 text-white font-bold rounded-md hover:bg-black transition-colors ${isRTL ? 'float-left' : 'float-right'}`}>
                  {uiText.post_comment}
                </button>
              </div>
            ) : (
              <p className="text-stone-600 bg-stone-100 p-4 rounded-md text-center">{uiText.login_to_comment}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
