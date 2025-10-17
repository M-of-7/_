import React from 'react';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { Language } from '../src/types';
// FIX: Corrected import path to point to the file inside the 'src' directory.
// FIX: Renamed MOOD_FILTERS to TOPIC_FILTERS to match exported constant from src/constants.ts.
import { TOPIC_FILTERS, UI_TEXT } from '../src/constants';

// FIX: Updated props to reflect topic filtering instead of mood filtering. The interface name is also updated for clarity.
interface TopicFilterProps {
  language: Language;
  activeTopic: string;
  onSelect: (topicKey: string) => void;
}

const MoodFilter: React.FC<TopicFilterProps> = ({ language, activeTopic, onSelect }) => {
  // FIX: Use TOPIC_FILTERS instead of non-existent MOOD_FILTERS.
  const filters = TOPIC_FILTERS[language];
  // FIX: Use topic_filter_prompt instead of non-existent mood_filter_prompt.
  const promptText = UI_TEXT[language].topic_filter_prompt;

  return (
    <div className="my-6 p-4 bg-white rounded-lg shadow-sm border border-stone-200">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h3 className="text-md font-bold text-stone-700 flex-shrink-0">{promptText}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(filter => (
            <button
              key={filter.key}
              // FIX: Updated onClick handler to pass only the topic key as per new prop type.
              onClick={() => onSelect(filter.key)}
              className={`
                px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200
                ${// FIX: Compare with activeTopic prop instead of activeMood.
                activeTopic === filter.key 
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

export default MoodFilter;
