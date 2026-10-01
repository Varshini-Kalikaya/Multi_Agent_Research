import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HelperButton from './HelperButton.jsx';
import HelperChat from './HelperChat.jsx';
import { HelperAPI, ResearchAPI } from '../../services/api.js';
import { useResearch } from '../../context/ResearchContext.jsx';
import './Helper.css';

export default function Helper() {
  const navigate = useNavigate();
  const { fetchSessions } = useResearch();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Persistent conversational history
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('helper_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent AI configuration
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('helper_ai_settings');
      return saved ? JSON.parse(saved) : { provider: 'builtin', apiKey: '', model: '' };
    } catch {
      return { provider: 'builtin', apiKey: '', model: '' };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLaunchingResearch, setIsLaunchingResearch] = useState(false);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('helper_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist Helper chat to localStorage', e);
    }
  }, [messages]);

  // Sync AI settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('helper_ai_settings', JSON.stringify(aiSettings));
    } catch (e) {
      console.warn('Failed to persist Helper AI settings', e);
    }
  }, [aiSettings]);

  // Close or minimize on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        setIsMinimized(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized]);

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsExpanded(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem('helper_chat_messages');
    } catch {}
  };

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    // Prepare up to 10 PREVIOUS conversational turns (excluding the current new turn)
    const historyPayload = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await HelperAPI.chat({
        message: text.trim(),
        history: historyPayload,
        customApiKey: aiSettings.apiKey?.trim() || null,
        customProvider: aiSettings.provider !== 'builtin' ? aiSettings.provider : null,
        customModel: aiSettings.model?.trim() || null,
      });

      if (response && response.success) {
        const assistantMsg = {
          role: 'assistant',
          content: response.message,
          isResearchTopic: response.isResearchTopic || false,
          suggestedTopic: response.suggestedTopic || null,
          provider: response.provider || 'ai-assistant',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(response?.message || "I couldn't process that request. Please try again.");
      }
    } catch (err) {
      console.error('Helper chat request failed', err);
      setError("I couldn't process that request right now. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchResearch = async (topic) => {
    if (!topic || isLaunchingResearch) return;

    setIsLaunchingResearch(true);
    try {
      const session = await ResearchAPI.createSession(topic);
      fetchSessions();

      const targetSessionId = session._id || session.sessionId;
      // Minimize Helper and navigate user straight to active research dashboard
      setIsMinimized(true);
      navigate(`/research/${targetSessionId}`);
    } catch (err) {
      console.error('Failed to launch research session from Helper', err);
      setError('Unable to launch research session. Please check your network connection.');
    } finally {
      setIsLaunchingResearch(false);
    }
  };

  return (
    <div className="helper-root-container">
      {/* Floating launcher button in bottom-right corner */}
      <HelperButton
        onClick={handleToggleOpen}
        isOpen={isOpen}
        isMinimized={isMinimized}
        unreadCount={0}
      />

      {/* Floating Chat Modal */}
      {isOpen && !isMinimized && (
        <HelperChat
          messages={messages}
          isLoading={isLoading}
          error={error}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          onMinimize={handleMinimize}
          onClose={handleClose}
          onClearChat={handleClearChat}
          onSendMessage={handleSendMessage}
          onLaunchResearch={handleLaunchResearch}
          isLaunchingResearch={isLaunchingResearch}
          aiSettings={aiSettings}
          onUpdateAiSettings={setAiSettings}
        />
      )}
    </div>
  );
}
