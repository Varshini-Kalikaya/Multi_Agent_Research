import React, { useState } from 'react';
import {
  Layers,
  Search,
  FileText,
  ShieldCheck,
  PenTool,
  CheckCheck,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';

const AGENTS = [
  { id: 'PLANNING', name: 'Planner Agent', role: 'Question Decomposition', icon: Layers, minProgress: 15 },
  { id: 'SEARCHING', name: 'Search Agent', role: 'Parallel Web Discovery', icon: Search, minProgress: 40 },
  { id: 'SUMMARIZING', name: 'Summarizer Agent', role: 'Content & Claim Extraction', icon: FileText, minProgress: 65 },
  { id: 'FACT_CHECKING', name: 'Fact-Checker Agent', role: 'Cross-Source Verification', icon: ShieldCheck, minProgress: 75 },
  { id: 'WRITING', name: 'Writer Agent', role: 'Report Synthesis', icon: PenTool, minProgress: 90 },
  { id: 'VALIDATION', name: 'Citation Validator', role: 'Citation Audit & Repair', icon: CheckCheck, minProgress: 100 },
];

export default function AgentTracker({
  currentStage = 'INIT',
  progress = 0,
  currentMessage = 'Initializing research pipeline...',
  events = [],
}) {
  const [showLogs, setShowLogs] = useState(true);

  // Helper to determine status for each agent
  const getAgentStatus = (agent, index) => {
    if (progress >= agent.minProgress && currentStage !== agent.id) {
      return 'completed';
    }
    if (currentStage === agent.id) {
      return 'active';
    }
    // Check if subsequent agent is already running
    const activeIndex = AGENTS.findIndex((a) => a.id === currentStage);
    if (activeIndex > index) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Header & Overall Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Multi-Agent Research Pipeline</h3>
            <span className="badge badge-info">{progress}% Complete</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {currentMessage}
          </p>
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className="btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Terminal size={14} />
          <span>{showLogs ? 'Hide Logs' : 'View Live Logs'}</span>
          {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(2, progress))}%`,
            background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
          }}
        />
      </div>

      {/* 6-Agent Grid Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: showLogs ? '1.5rem' : 0,
        }}
      >
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const status = getAgentStatus(agent, idx);

          let borderColor = 'var(--border-subtle)';
          let bgColor = 'rgba(255, 255, 255, 0.02)';
          let iconColor = 'var(--text-muted)';
          let statusBadge = null;

          if (status === 'completed') {
            borderColor = 'rgba(16, 185, 129, 0.35)';
            bgColor = 'rgba(16, 185, 129, 0.06)';
            iconColor = '#34d399';
            statusBadge = (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>Done</span>
              </span>
            );
          } else if (status === 'active') {
            borderColor = '#6366f1';
            bgColor = 'rgba(99, 102, 241, 0.12)';
            iconColor = '#818cf8';
            statusBadge = (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600 }}>
                <Loader2 size={13} className="animate-spin" />
                <span>Active</span>
              </span>
            );
          } else {
            statusBadge = (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Waiting</span>
            );
          }

          return (
            <div
              key={agent.id}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 0.85rem',
                position: 'relative',
                transition: 'all var(--transition-normal)',
                boxShadow: status === 'active' ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: status === 'active' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: iconColor,
                  }}
                >
                  <Icon size={18} />
                </div>
                {statusBadge}
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem', color: status === 'pending' ? 'var(--text-secondary)' : '#ffffff' }}>
                {agent.name}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {agent.role}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Activity Log Stream */}
      {showLogs && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
            <Terminal size={14} />
            <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Real-Time Event Stream ({events.length} events logged)
            </span>
          </div>

          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
              Waiting for agent activity signals...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '0.35rem' }}>
              {events.slice().reverse().map((evt) => {
                const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '';
                return (
                  <div key={evt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', lineHeight: 1.4 }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      [{timeStr}]
                    </span>
                    <span
                      style={{
                        color: evt.stage === 'COMPLETED' ? '#34d399' : evt.stage === 'FAILED' ? '#f87171' : '#818cf8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {evt.stage}:
                    </span>
                    <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>
                      {evt.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
