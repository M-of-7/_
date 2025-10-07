import React, { useState } from 'react';
import type { Comment } from '../types';

interface CommentSectionProps {
  articleId: string;
  comments: Comment[];
  isLoggedIn: boolean;
  onAddComment: (articleId: string, commentText: string) => void;
  uiText: {
    comments_title: string;
    add_comment_placeholder: string;
    post_comment: string;
    login_to_comment: string;
  };
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleId, comments, isLoggedIn, onAddComment, uiText }) => {
  const [newComment, setNewComment] = useState('');
  const isRTL = document.documentElement.dir === 'rtl';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && isLoggedIn) {
      onAddComment(articleId, newComment);
      setNewComment('');
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-stone-300">
      <h3 className={`text-2xl font-bold mb-4 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{uiText.comments_title} ({comments.length})</h3>
      
      <div className="space-y-3 mb-6">
        {comments.map((comment, index) => (
          <div key={index} className="bg-stone-200 p-3 rounded-lg">
            <p className="font-bold text-stone-700 text-sm">{comment.author}</p>
            <p className="text-stone-800">{comment.text}</p>
          </div>
        ))}
      </div>
      
      <div>
        {isLoggedIn ? (
          <form onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={uiText.add_comment_placeholder}
              className="w-full p-3 border border-stone-300 rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-stone-400"
              required
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-900 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
            >
              {uiText.post_comment}
            </button>
          </form>
        ) : (
          <div className="text-center p-4 bg-stone-200 border-t-2 border-stone-300 rounded-lg">
            <p className="text-stone-600">{uiText.login_to_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
