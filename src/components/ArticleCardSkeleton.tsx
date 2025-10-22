import React from 'react';

interface ArticleCardSkeletonProps {
  isFeatured?: boolean;
}

const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ isFeatured = false }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden animate-pulse ${
        isFeatured ? 'flex flex-col md:flex-row' : 'flex flex-col'
      }`}
    >
      <div
        className={`bg-slate-300 ${
          isFeatured ? 'md:w-1/2 h-64 md:h-auto' : 'h-48'
        }`}
      ></div>
      <div
        className={`p-6 flex flex-col justify-between ${
          isFeatured ? 'md:w-1/2' : ''
        }`}
      >
        <div>
          <div className="h-4 bg-slate-300 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-slate-400 rounded w-full mb-4"></div>
          {isFeatured && <div className="h-6 bg-slate-400 rounded w-3/4 mb-4"></div>}
          <div className="h-4 bg-slate-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-300 rounded w-5/6 mb-4"></div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 bg-slate-300 rounded w-1/3"></div>
          <div className="h-10 bg-slate-400 rounded-lg w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
