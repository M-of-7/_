import React from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface LoadingOverlayProps {
  title: string;
  subtitle: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ title, subtitle }) => {
  const isRTL = document.documentElement.dir === 'rtl';
  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center text-stone-800 text-center p-4">
      <SpinnerIcon className="w-12 h-12 mb-6 text-stone-500" />
      <h1 className={`text-3xl font-bold mb-2 ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{title}</h1>
      <p className="text-lg text-stone-500 max-w-md">{subtitle}</p>
    </div>
  );
};

export default LoadingOverlay;
