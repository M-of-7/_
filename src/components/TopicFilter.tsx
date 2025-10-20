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
    <div className="my-6 p-5 bg-gradient-to-r from-white via-stone-50 to-white rounded-xl shadow-lg border-2 border-stone-200">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h3 className="text-lg font-bold text-stone-800 flex-shrink-0">{promptText}</h3>
        <div className="flex flex-wrap items-center gap-3">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => onSelect(filter.key)}
              className={`
                px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 transform hover:-translate-y-0.5
                ${activeTopic === filter.key
                  ? 'bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg'
                  : 'bg-stone-200 text-stone-800 hover:bg-stone-300 shadow-md'}
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
