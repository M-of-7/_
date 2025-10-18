import React from 'react';
import type { Language } from '../types';
import { TOPIC_FILTERS, UI_TEXT } from '../constants';

interface TopicFilterProps {
  language: Language;
  activeTopic: string;
  onSelect: (topicKey: string) => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ language, activeTopic, onSelect }) => {
  const filters = TOPIC_FILTERS[language];
  const promptText = UI_TEXT[language].topic_filter_prompt;

  return (
    <div className="my-6 p-4 bg-white rounded-lg shadow-sm border border-stone-200">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h3 className="text-md font-bold text-stone-700 flex-shrink-0">{promptText}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => onSelect(filter.key)}
              className={`
                px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200
                ${activeTopic === filter.key 
                  ? 'bg-stone-800 text-white shadow' 
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicFilter;