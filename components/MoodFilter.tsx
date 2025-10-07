import React from 'react';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import type { Language } from '../src/types';
// FIX: Corrected import path to point to the file inside the 'src' directory.
import { MOOD_FILTERS, UI_TEXT } from '../src/constants';

interface MoodFilterProps {
  language: Language;
  activeMood: string;
  onSelect: (moodKey: string, moodLabel: string) => void;
}

const MoodFilter: React.FC<MoodFilterProps> = ({ language, activeMood, onSelect }) => {
  const filters = MOOD_FILTERS[language];
  const promptText = UI_TEXT[language].mood_filter_prompt;

  return (
    <div className="my-6 p-4 bg-white rounded-lg shadow-sm border border-stone-200">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h3 className="text-md font-bold text-stone-700 flex-shrink-0">{promptText}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => onSelect(filter.key, filter.label)}
              className={`
                px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200
                ${activeMood === filter.key 
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