import React, { useState, useRef } from 'react';
import type { Article, Language } from '../types';
import { UI_TEXT } from '../constants';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  language: Language;
  isLoggedIn: boolean;
  onAddComment: (articleId: string, commentText: string) => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, language, isLoggedIn, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const uiText = UI_TEXT[language];
  const modalRef = useRef<HTMLDivElement>(null);

  if (!article) return null;

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
    <div ref={modalRef} onClick={handleOverlayClick} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">{article.headline}</h2>
            <p className="text-stone-500 mt-1">{article.byline} &middot; {new Date(article.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
          </div>
          <button onClick={onClose} className="text-3xl text-stone-500 hover:text-stone-800">&times;</button>
        </div>
        
        <div className="overflow-y-auto">
          <img src={article.imageUrl} alt={article.headline} className="w-full h-96 object-cover" />
          <div className="p-8 prose max-w-none">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{article.body}</p>
          </div>

          <div className="p-8">
            <h3 className="text-2xl font-bold mb-4">{uiText.comments_title}</h3>
            <div className="space-y-4 mb-6">
              {article.comments.length > 0 ? (
                article.comments.map((comment, index) => (
                  <div key={index} className="bg-stone-100 p-4 rounded-lg">
                    <p className="font-bold text-stone-800">{comment.author}</p>
                    <p className="text-stone-600">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-stone-500">{language === 'ar' ? 'لا توجد تعليقات بعد.' : 'No comments yet.'}</p>
              )}
            </div>
            {isLoggedIn ? (
              <div className="flex flex-col">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={uiText.add_comment_placeholder}
                  className="w-full p-3 border border-stone-300 rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                ></textarea>
                <button onClick={handlePostComment} className="self-end px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors">
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
