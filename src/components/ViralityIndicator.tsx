import React from 'react';
import { UI_TEXT } from '../constants';
import TrendingUpIcon from './icons/TrendingUpIcon';

interface ViralityIndicatorProps {
  virality?: string;
  uiText: typeof UI_TEXT['en'];
}

const ViralityIndicator: React.FC<ViralityIndicatorProps> = ({ virality, uiText }) => {
  const viralityLower = virality?.toLowerCase() || 'unknown';

  let colorClasses = '';
  let text = '';
  const isRTL = uiText.language_toggle === 'English';

  switch (viralityLower) {
    case 'fast':
      colorClasses = 'bg-red-100 text-red-800';
      text = uiText.fast_spreading;
      break;
    case 'medium':
      colorClasses = 'bg-yellow-100 text-yellow-800';
      text = uiText.medium_spreading;
      break;
    case 'low':
      colorClasses = 'bg-blue-100 text-blue-800';
      text = uiText.low_spreading;
      break;
    default:
      return null;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${colorClasses}`}
      title={uiText.virality_tooltip}
    >
      <TrendingUpIcon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
};

export default ViralityIndicator;
