import React from 'react';
import { TOPIC_FILTERS } from '../constants';
import type { Language } from '../types';

interface TopicFilterProps {
  language: Language;
  activeTopic: string;
  onSelect: (topicKey: string) => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ language, activeTopic, onSelect }) => {
  const topics = TOPIC_FILTERS[language];
  
  return (
    <div className="w-full overflow-x-auto pb-3" aria-label="Article topic filter">
      <div className="flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap">
        {topics.map((topic) => (
          <button
            key={topic.key}
            onClick={() => onSelect(topic.key)}
            aria-pressed={activeTopic === topic.key}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5
              ${
                activeTopic === topic.key
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300 hover:shadow-md'
              }
            `}
          >
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicFilter;
