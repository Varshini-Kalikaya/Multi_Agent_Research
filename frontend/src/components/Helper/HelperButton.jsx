import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

export default function HelperButton({ onClick, isOpen, isMinimized, unreadCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`helper-floating-button ${isOpen && !isMinimized ? 'helper-floating-button-active' : ''}`}
      aria-label={isOpen && !isMinimized ? 'Minimize Helper AI assistant' : 'Open Helper AI assistant'}
      title={isOpen && !isMinimized ? 'Minimize Helper' : 'Ask Helper AI'}
      type="button"
      id="helper-toggle-button"
    >
      <div className="helper-floating-button-glow" />
      <div className="helper-floating-button-inner">
        <Sparkles size={18} className="helper-button-sparkle-icon" />
        <span className="helper-button-text">Helper</span>
        {unreadCount > 0 && !isOpen && (
          <span className="helper-unread-badge">{unreadCount}</span>
        )}
      </div>
    </button>
  );
}
