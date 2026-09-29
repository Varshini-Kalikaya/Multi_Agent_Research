import React from 'react';
import { X, ExternalLink, Globe, FileText, CheckCircle2 } from 'lucide-react';

export default function CitationModal({ citationId, source, onClose }) {
  if (!citationId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '1.75rem',
          position: 'relative',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {citationId.startsWith('[') ? citationId : `[${citationId}]`}
          </span>
          <span className="badge badge-info">Verified Citation Source</span>
        </div>

        {source ? (
          <div>
            <h3 style={{ fontSize: '1.15rem', lineHeight: 1.35, marginBottom: '0.65rem' }}>
              {source.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <Globe size={14} />
                <span>{source.domain || 'web'}</span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {source.sourceType || 'General'}
              </span>
              {source.status && (
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {source.status}
                </span>
              )}
            </div>

            {/* URL Link */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Source Target URL:
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  wordBreak: 'break-all',
                }}
              >
                <span>{source.url}</span>
                <ExternalLink size={14} style={{ flexShrink: 0 }} />
              </a>
            </div>

            {/* Snippet / Content Preview */}
            {(source.snippet || source.content) && (
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Evidence Excerpt
                </div>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid #6366f1',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {source.snippet || source.content?.slice(0, 400)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
            Source details for <strong>{citationId}</strong> are registered in this session.
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-secondary btn-sm">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
