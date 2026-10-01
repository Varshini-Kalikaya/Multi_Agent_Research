import React from 'react';
import { Sparkles, Terminal, BookOpen, Layers, Lightbulb } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  {
    icon: Sparkles,
    label: 'What is RAG?',
    query: 'What is RAG (Retrieval-Augmented Generation) and how does it compare to fine-tuning?',
  },
  {
    icon: Layers,
    label: 'How the research pipeline works',
    query: 'How does the autonomous research pipeline work on this platform?',
  },
  {
    icon: Terminal,
    label: 'Python code to reverse an array',
    query: 'Give me Python code to reverse an array with time and space complexity.',
  },
  {
    icon: BookOpen,
    label: 'Research: Impact of AI on jobs in India',
    query: 'Research the impact of AI on jobs in India across IT and healthcare.',
  },
  {
    icon: Lightbulb,
    label: 'Explain REST APIs with an example',
    query: 'Explain REST APIs in simple terms with a practical example.',
  },
];

export default function HelperSuggestions({ onSelectSuggestion, disabled = false }) {
  return (
    <div className="helper-suggestions-container">
      <div className="helper-suggestions-title">
        <Sparkles size={14} className="helper-suggestions-sparkle" />
        <span>Try asking Helper:</span>
      </div>
      <div className="helper-suggestions-grid">
        {DEFAULT_SUGGESTIONS.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectSuggestion(item.query)}
              disabled={disabled}
              type="button"
              className="helper-suggestion-chip"
              title={item.query}
            >
              <IconComponent size={13} className="helper-suggestion-icon" />
              <span className="helper-suggestion-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
