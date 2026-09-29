import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext.jsx';

export default function ResearchHistory() {
  const navigate = useNavigate();
  const { sessions, isLoadingSessions, deleteSession } = useResearch();
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('');

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this research session?')) {
      return;
    }

    try {
      setDeletingId(sessionId);
      await deleteSession(sessionId);
    } catch (err) {
      alert(`Failed to delete session: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSessions = (sessions || []).filter((s) =>
    (s.topic || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1000px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <History size={26} color="#818cf8" />
            <span>Research History</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Browse and review past multi-agent research sessions and synthesized reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PlusCircle size={15} />
          <span>New Research Topic</span>
        </button>
      </div>

      {/* Filter / Search input */}
      <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter research sessions by topic..."
          className="input-field"
          style={{ paddingLeft: '2.75rem', height: '48px', fontSize: '0.95rem' }}
        />
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
      </div>

      {/* Sessions List */}
      {isLoadingSessions ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>⚙️</div>
          Loading past research sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <History size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.5rem' }}>
            No Research Sessions Found
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            {filter
              ? `No sessions matching "${filter}". Try another query.`
              : 'You have not run any research sessions yet. Enter a research question to see multi-agent synthesis in action.'}
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Start Your First Research
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSessions.map((session) => {
            const isCompleted = session.status === 'COMPLETED';
            return (
              <div
                key={session._id}
                onClick={() => navigate(`/research/${session._id}`)}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className={`badge ${isCompleted ? 'badge-success' : 'badge-info'}`}>
                      {session.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Progress: {session.progress || 0}%
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', lineHeight: 1.35, color: '#ffffff', marginBottom: '0.5rem' }}>
                    {session.topic}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} />
                      <span>{new Date(session.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {session.researchPlan?.subQuestions?.length > 0 && (
                      <span>• {session.researchPlan.subQuestions.length} Sub-Questions</span>
                    )}
                  </div>
                </div>

                {/* Right side actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={(e) => handleDelete(e, session._id)}
                    disabled={deletingId === session._id}
                    className="btn-secondary btn-sm"
                    style={{ padding: '0.45rem', color: '#f87171' }}
                    title="Delete research session"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={() => navigate(`/research/${session._id}`)}
                    className="btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>{isCompleted ? 'View Report' : 'Open Pipeline'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
