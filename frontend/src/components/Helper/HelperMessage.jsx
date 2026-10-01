import React from 'react';
import { Sparkles, User, ArrowRight, Play, CheckCircle } from 'lucide-react';
import SafeMarkdown from './SafeMarkdown.jsx';

export default function HelperMessage({ message, onLaunchResearch, isLaunchingResearch }) {
  const isUser = message.role === 'user';
  const isHelper = message.role === 'assistant';

  return (
    <div className={`helper-message-row ${isUser ? 'helper-message-user' : 'helper-message-assistant'}`}>
      <div className="helper-avatar">
        {isUser ? (
          <div className="helper-avatar-user" title="You">
            <User size={14} />
          </div>
        ) : (
          <div className="helper-avatar-helper" title="Helper AI">
            <Sparkles size={14} />
          </div>
        )}
      </div>

      <div className="helper-message-bubble-wrapper">
        <div className="helper-message-header">
          <span className="helper-sender-name">
            {isUser ? 'You' : '✨ Helper'}
          </span>
          {message.timestamp && (
            <span className="helper-message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="helper-message-content">
          <SafeMarkdown content={message.content} />

          {/* Research Pipeline Action Card if message is identified as an empirical research query */}
          {message.isResearchTopic && message.suggestedTopic && (
            <div className="helper-research-action-card">
              <div className="helper-research-action-header">
                <span className="helper-research-badge">
                  <Play size={11} fill="currentColor" /> Autonomous Research Workflow
                </span>
              </div>
              <div className="helper-research-action-topic">
                <strong>Topic:</strong> "{message.suggestedTopic}"
              </div>
              <p className="helper-research-action-desc">
                Our 6 coordinated agents will decompose this topic, search authentic web sources, extract empirical facts, and validate citations with zero fabrication.
              </p>
              <button
                type="button"
                className="helper-launch-research-btn"
                onClick={() => onLaunchResearch(message.suggestedTopic)}
                disabled={isLaunchingResearch}
              >
                {isLaunchingResearch ? (
                  <>
                    <span className="helper-spinner-inline" />
                    <span>Launching Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Launch Deep Research</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
