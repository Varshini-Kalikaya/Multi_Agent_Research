import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  Sliders,
  History,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResearchAPI } from '../services/api.js';
import { useResearch } from '../context/ResearchContext.jsx';

const SUGGESTIONS = [
  'What is the impact of AI on the job market in India?',
  'How will quantum computing break RSA and ECC cryptography?',
  'What are the commercial solid-state battery energy density breakthroughs?',
  'What are the weight constraints in autonomous electric aviation?',
  'How effective is CRISPR-Cas9 in monogenic rare disease clinical trials?',
];

export default function Home() {
  const navigate = useNavigate();
  const { sessions, fetchSessions } = useResearch();

  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxSources, setMaxSources] = useState(5);
  const [searchDepth, setSearchDepth] = useState('thorough');
  const [inputError, setInputError] = useState('');

  const handleStartResearch = async (targetTopic = null) => {
    const query = (targetTopic || topic).trim();
    if (!query) {
      setInputError('Please enter a research topic or select a suggestion.');
      return;
    }
    if (query.length < 5) {
      setInputError('Research question must be at least 5 characters.');
      return;
    }

    setInputError('');
    setIsSubmitting(true);

    try {
      // 1. Create research session in backend
      const session = await ResearchAPI.createSession(query);

      // 2. Fetch updated sessions in context
      fetchSessions();

      // 3. Navigate directly to active research dashboard
      const targetSessionId = session._id || session.sessionId;
      navigate(`/research/${targetSessionId}`);
    } catch (err) {
      console.error('Failed to create research session:', err);
      setInputError(err.response?.data?.message || err.message || 'Failed to initialize session');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: '1000px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#a5b4fc',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles size={15} color="#818cf8" />
          <span>Autonomous Multi-Agent Intelligence Engine</span>
        </div>

        <h1
          style={{
            fontSize: '2.85rem',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Rigorous Research Synthesis <br />
          Backed by Grounded Citations
        </h1>

        <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Enter any complex technical, scientific, or policy question. Specialized AI agents autonomously plan, search, extract claims, detect contradictions, and synthesize a peer-grade cited report.
        </p>
      </div>

      {/* Main Research Input Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2.5rem',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartResearch();
          }}
        >
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="E.g. What is the impact of artificial intelligence on employment in India?"
              className="input-field"
              style={{
                paddingLeft: '3.25rem',
                paddingRight: '1rem',
                fontSize: '1.1rem',
                height: '60px',
              }}
              disabled={isSubmitting}
            />
            <Search
              size={22}
              style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#818cf8',
              }}
            />
          </div>

          {inputError && (
            <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
              {inputError}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Sliders size={15} />
              <span>Advanced Pipeline Parameters</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '0.875rem 2rem',
                fontSize: '1.05rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Initializing Agents...</span>
                </>
              ) : (
                <>
                  <span>Start Autonomous Research</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Advanced Options Dropdown */}
          {showAdvanced && (
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Search Depth:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['quick', 'thorough'].map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => setSearchDepth(depth)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        background: searchDepth === depth ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${searchDepth === depth ? '#6366f1' : 'var(--border-subtle)'}`,
                        color: searchDepth === depth ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Max Target Sources: {maxSources}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={maxSources}
                  onChange={(e) => setMaxSources(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Suggestion Chips */}
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontWeight: 500 }}>
            Suggested Research Prompts:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(item);
                  handleStartResearch(item);
                }}
                className="suggestion-chip"
              >
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions Quick Access */}
      {sessions && sessions.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="#818cf8" />
              <span>Recent Research Sessions</span>
            </h3>
            <button
              onClick={() => navigate('/history')}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              View all ({sessions.length}) →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {sessions.slice(0, 3).map((s) => (
              <div
                key={s._id}
                onClick={() => navigate(`/research/${s._id}`)}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className={`badge ${s.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>
                      {s.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.progress}%
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.topic}
                  </h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={12} />
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span style={{ color: '#818cf8', fontWeight: 500 }}>Open Session →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
