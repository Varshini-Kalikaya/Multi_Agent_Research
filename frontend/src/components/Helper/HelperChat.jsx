import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Minus,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertCircle,
  Settings,
  Key,
  Shield,
  Check,
  Cpu,
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
  aiSettings,
  onUpdateAiSettings,
}) {
  const scrollRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempProvider, setTempProvider] = useState(aiSettings?.provider || 'builtin');
  const [tempApiKey, setTempApiKey] = useState(aiSettings?.apiKey || '');
  const [tempModel, setTempModel] = useState(aiSettings?.model || '');

  // Keep temporary settings in sync when aiSettings updates
  useEffect(() => {
    if (aiSettings) {
      setTempProvider(aiSettings.provider || 'builtin');
      setTempApiKey(aiSettings.apiKey || '');
      setTempModel(aiSettings.model || '');
    }
  }, [aiSettings]);

  // Auto-scroll to bottom on new messages, loading state, or error
  useEffect(() => {
    if (scrollRef.current && !showSettings) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, error, showSettings]);

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    onUpdateAiSettings({
      provider: tempProvider,
      apiKey: tempApiKey.trim(),
      model: tempModel.trim(),
    });
    setShowSettings(false);
  };

  const getActiveBadgeInfo = () => {
    switch (aiSettings?.provider) {
      case 'openai':
        return { label: 'OpenAI', icon: '⚡' };
      case 'gemini':
        return { label: 'Gemini', icon: '💎' };
      case 'groq':
        return { label: 'Groq', icon: '🚀' };
      default:
        return { label: 'Autonomous AI', icon: '✨' };
    }
  };

  const badge = getActiveBadgeInfo();

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
              <span className="helper-active-provider-badge" title={`Active Provider: ${badge.label}`}>
                <span className="helper-status-dot" />
                <span>{badge.icon} {badge.label}</span>
              </span>
            </div>
            <span className="helper-subtitle">Your AI research & coding companion</span>
          </div>
        </div>

        <div className="helper-header-actions">
          {messages.length > 0 && !showSettings && (
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
            onClick={() => setShowSettings((prev) => !prev)}
            className={`helper-action-icon-btn ${showSettings ? 'helper-action-icon-active' : ''}`}
            title="AI Model & Provider Settings"
            aria-label="AI Model Settings"
            type="button"
          >
            <Settings size={15} />
          </button>

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

      {/* Settings Panel Overlay */}
      {showSettings ? (
        <div className="helper-settings-panel">
          <div className="helper-settings-header">
            <div className="helper-settings-title-row">
              <Cpu size={16} className="helper-settings-icon" />
              <h4>AI Engine & Model Configuration</h4>
            </div>
            <p className="helper-settings-subtitle">
              Choose your preferred AI intelligence provider or use the built-in free autonomous AI engine.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="helper-settings-form">
            <div className="helper-settings-field">
              <label htmlFor="helper-provider-select">AI Provider</label>
              <select
                id="helper-provider-select"
                value={tempProvider}
                onChange={(e) => setTempProvider(e.target.value)}
                className="helper-settings-select"
              >
                <option value="builtin">Autonomous Neural AI (Built-in Free • No Setup)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                <option value="groq">Groq (Llama 3.3 70B • High-Speed)</option>
              </select>
            </div>

            {tempProvider !== 'builtin' && (
              <>
                <div className="helper-settings-field">
                  <label htmlFor="helper-api-key">
                    <Key size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {tempProvider === 'openai' && 'OpenAI API Key'}
                    {tempProvider === 'gemini' && 'Google Gemini API Key'}
                    {tempProvider === 'groq' && 'Groq API Key'}
                  </label>
                  <input
                    id="helper-api-key"
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={`Enter your ${tempProvider.toUpperCase()} API key...`}
                    className="helper-settings-input"
                    autoComplete="off"
                  />
                  <span className="helper-settings-hint">
                    <Shield size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    Key is securely stored in your local browser only.
                  </span>
                </div>

                <div className="helper-settings-field">
                  <label htmlFor="helper-model-name">Model Override (Optional)</label>
                  <input
                    id="helper-model-name"
                    type="text"
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    placeholder={
                      tempProvider === 'openai'
                        ? 'gpt-4o-mini'
                        : tempProvider === 'gemini'
                        ? 'gemini-1.5-flash'
                        : 'llama-3.3-70b-versatile'
                    }
                    className="helper-settings-input"
                  />
                </div>
              </>
            )}

            <div className="helper-settings-actions">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="helper-settings-cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="helper-settings-save-btn">
                <Check size={14} /> Save Configuration
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Messages Scroll Area */
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
                <span className="helper-loading-text">Helper is generating response</span>
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
      )}

      {/* Input Form */}
      {!showSettings && (
        <HelperInput
          onSendMessage={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Helper is responding..." : "Ask Helper anything... (e.g. concepts, code, or research)"}
        />
      )}
    </div>
  );
}
