import React from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface LoadingOverlayProps {
  title: string;
  subtitle: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ title, subtitle }) => {
  const isRTL = document.documentElement.dir === 'rtl';
  return (
    <div className="fixed inset-0 bg-stone-900/75 flex flex-col items-center justify-center z-[100] text-white">
        <SpinnerIcon className="w-16 h-16 text-white" />
        <h2 className={`mt-6 text-3xl font-bold ${isRTL ? 'font-serif-ar' : 'font-header-en'}`}>{title}</h2>
        <p className="mt-2 text-lg">{subtitle}</p>
    </div>
  );
};

export default LoadingOverlay;