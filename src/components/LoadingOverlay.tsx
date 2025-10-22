import React from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface LoadingOverlayProps {
  title: string;
  subtitle: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ title, subtitle }) => {
  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-95 z-[100] flex flex-col items-center justify-center text-white text-center p-4">
      <SpinnerIcon className="w-16 h-16 mb-6" />
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-lg text-stone-300 max-w-md">{subtitle}</p>
    </div>
  );
};

export default LoadingOverlay;
