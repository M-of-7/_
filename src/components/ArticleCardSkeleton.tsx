import React from 'react';

interface ArticleCardSkeletonProps {
  isFeatured?: boolean;
}

const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ isFeatured = false }) => {
  const cardClasses = `
    ${isFeatured ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : 'col-span-1'}
    bg-white flex flex-col shadow-md rounded-lg overflow-hidden
  `;

  return (
    <div className={cardClasses} aria-hidden="true">
      {/* Image Placeholder */}
      <div className="relative h-48 w-full bg-stone-200 animate-pulse">
         {/* Category Placeholder */}
         <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-stone-300 h-5 w-20 rounded z-10"></div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        {/* Headline Placeholder */}
        <div className={`h-8 bg-stone-200 rounded animate-pulse ${isFeatured ? 'w-5/6' : 'w-4/5'}`}></div>
        
        {/* Meta Placeholder */}
        <div className="flex items-center gap-2 mt-2 mb-3">
            <div className="h-4 w-1/2 bg-stone-200 rounded animate-pulse"></div>
        </div>
        
        {/* Body Snippet Placeholder */}
        <div className="space-y-2 flex-grow">
            <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-stone-200 rounded animate-pulse w-5/6"></div>
            {isFeatured && <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>}
        </div>

        {/* Read More Placeholder */}
        <div className="h-5 w-24 bg-stone-200 rounded animate-pulse mt-4 self-start"></div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
