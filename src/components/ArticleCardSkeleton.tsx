import React from 'react';

interface ArticleCardSkeletonProps {
    isFeatured?: boolean;
}

const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ isFeatured = false }) => {
  if (isFeatured) {
    return (
        <div className="bg-white flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden w-full h-full" aria-hidden="true">
            <div className="relative md:w-1/2 h-64 md:h-auto w-full bg-stone-200 animate-pulse flex-shrink-0"></div>
            <div className="p-6 flex flex-col flex-grow w-full md:w-1/2">
                <div className="h-4 w-20 bg-stone-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-stone-200 rounded animate-pulse w-4/5 mb-2"></div>
                <div className="h-8 bg-stone-200 rounded animate-pulse w-3/5 mb-3"></div>
                <div className="h-4 w-1/2 bg-stone-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-stone-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
                </div>
                <div className="h-5 w-24 bg-stone-200 rounded animate-pulse mt-4 self-start"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white flex flex-col shadow-md rounded-lg overflow-hidden w-full h-full" aria-hidden="true">
      <div className="relative h-48 w-full bg-stone-200 animate-pulse">
         <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-stone-300 h-5 w-20 rounded z-10"></div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="h-6 bg-stone-200 rounded animate-pulse w-4/5 mb-2"></div>
        <div className="h-4 w-1/2 bg-stone-200 rounded animate-pulse mb-3"></div>
        <div className="space-y-2 flex-grow">
            <div className="h-4 bg-stone-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-stone-200 rounded animate-pulse w-5/6"></div>
        </div>
        <div className="h-5 w-24 bg-stone-200 rounded animate-pulse mt-4 self-start"></div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;