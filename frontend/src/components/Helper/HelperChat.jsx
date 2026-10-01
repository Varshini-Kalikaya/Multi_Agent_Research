import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  Minus,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertCircle,
  Play,
  Layers,
} from 'lucide-react';
import HelperMessage from './HelperMessage.jsx';
import HelperSuggestions from './HelperSuggestions.jsx';
import HelperInput from './HelperInput.jsx';

export default function HelperChat({
  messages,
  isLoading,
  error,
  isExpanded,
  onToggleExpand,
  onMinimize,
  onClose,
  onClearChat,
  onSendMessage,
  onLaunchResearch,
  isLaunchingResearch,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, error]);

  return (
    <div
      className={`helper-chat-window ${isExpanded ? 'helper-chat-expanded' : ''}`}
      role="dialog"
      aria-label="Helper AI Assistant"
      aria-modal="false"
    >
      {/* Header */}
      <div className="helper-header">
        <div className="helper-header-left">
          <div className="helper-header-badge">
            <Sparkles size={16} className="helper-header-sparkle" />
          </div>
          <div className="helper-header-info">
            <div className="helper-title-row">
              <h3 className="helper-title">Helper</h3>
              <span className="helper-status-dot" title="Ready to assist" />
            </div>
            <span className="helper-subtitle">Your AI research companion</span>
          </div>
        </div>

        <div className="helper-header-actions">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="helper-action-icon-btn"
              title="Clear conversation"
              aria-label="Clear conversation"
              type="button"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="helper-action-icon-btn helper-desktop-only"
            title={isExpanded ? 'Restore size' : 'Expand window'}
            aria-label={isExpanded ? 'Restore size' : 'Expand window'}
            type="button"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            onClick={onMinimize}
            className="helper-action-icon-btn"
            title="Minimize Helper"
            aria-label="Minimize Helper"
            type="button"
          >
            <Minus size={15} />
          </button>

          <button
            onClick={onClose}
            className="helper-action-icon-btn helper-close-btn"
            title="Close Helper"
            aria-label="Close Helper"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="helper-messages-container" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="helper-empty-state">
            <div className="helper-empty-icon-wrap">
              <Sparkles size={28} className="helper-empty-sparkle" />
            </div>
            <h4 className="helper-empty-title">Hello! I'm Helper.</h4>
            <p className="helper-empty-desc">
              I can answer technical questions, write and debug code, explain complex concepts, or route research topics directly into our autonomous multi-agent pipeline.
            </p>

            <HelperSuggestions onSelectSuggestion={onSendMessage} disabled={isLoading} />
          </div>
        ) : (
          <div className="helper-messages-list">
            {messages.map((msg, index) => (
              <HelperMessage
                key={index}
                message={msg}
                onLaunchResearch={onLaunchResearch}
                isLaunchingResearch={isLaunchingResearch}
              />
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="helper-loading-row">
            <div className="helper-avatar-helper">
              <Sparkles size={14} />
            </div>
            <div className="helper-loading-bubble">
              <span className="helper-loading-text">Helper is thinking</span>
              <div className="helper-loading-dots">
                <span className="helper-dot" />
                <span className="helper-dot" />
                <span className="helper-dot" />
              </div>
            </div>
          </div>
        )}

        {/* Friendly Error Display */}
        {error && (
          <div className="helper-error-banner">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <HelperInput
        onSendMessage={onSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "Helper is responding..." : "Ask Helper anything..."}
      />
    </div>
  );
}
