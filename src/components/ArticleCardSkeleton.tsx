import React from 'react';

interface ArticleCardSkeletonProps {}

const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = () => {
  const cardClasses = `
    bg-white flex flex-col sm:flex-row shadow-md rounded-lg overflow-hidden w-full
  `;

  return (
    <div className={cardClasses} aria-hidden="true">
      {/* Image Placeholder */}
      <div className="relative sm:w-1/3 h-48 sm:h-auto w-full bg-stone-200 animate-pulse flex-shrink-0">
         {/* Category Placeholder */}
         <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-stone-300 h-5 w-20 rounded z-10"></div>
      </div>
      <div className="p-4 flex flex-col flex-grow w-full sm:w-2/3">
        {/* Headline Placeholder */}
        <div className="h-8 bg-stone-200 rounded animate-pulse w-4/5"></div>
        
        {/* Meta Placeholder */}
        <div className="flex items-center gap-2 mt-2 mb-3">
            <div className="h-4 w-1/2 bg-stone-200 rounded animate-pulse"></div>
        </div>
        
        {/* Body Snippet Placeholder */}
        <div className="space-y-2 flex-grow">
            <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-stone-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
        </div>

        {/* Read More Placeholder */}
        <div className="h-5 w-24 bg-stone-200 rounded animate-pulse mt-4 self-start"></div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
