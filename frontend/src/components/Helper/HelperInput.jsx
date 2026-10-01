import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export default function HelperInput({ onSendMessage, disabled = false, placeholder = "Ask Helper anything..." }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea to fit multi-line content comfortably
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Enter without Shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form className="helper-input-form" onSubmit={handleSubmit}>
      <div className="helper-input-container">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={4000}
          className="helper-textarea"
          aria-label="Ask Helper anything"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="helper-send-btn"
          aria-label="Send message to Helper"
          title="Send message (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
      <div className="helper-input-footer">
        <span className="helper-input-hint">
          <CornerDownLeft size={10} style={{ display: 'inline', marginRight: '3px' }} />
          Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline
        </span>
        {text.length > 500 && (
          <span className="helper-char-count">{text.length}/4000</span>
        )}
      </div>
    </form>
  );
}
