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
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLaunchingResearch, setIsLaunchingResearch] = useState(false);

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
  };

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    // Prepare up to 10 previous conversational turns
    const historyPayload = newMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await HelperAPI.chat({
        message: text.trim(),
        history: historyPayload,
      });

      if (response && response.success) {
        const assistantMsg = {
          role: 'assistant',
          content: response.message,
          isResearchTopic: response.isResearchTopic || false,
          suggestedTopic: response.suggestedTopic || null,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(response?.message || "I couldn't process that request. Please try again.");
      }
    } catch (err) {
      console.error('Helper chat request failed', err);
      setError("I couldn't process that request right now. Please try again.");
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
        />
      )}
    </div>
  );
}
