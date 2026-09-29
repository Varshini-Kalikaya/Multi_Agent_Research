import React from 'react';
import { ExternalLink, Globe, BookOpen, Building, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

export default function SourceCard({ source }) {
  if (!source) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'research':
        return <BookOpen size={12} />;
      case 'government':
        return <Building size={12} />;
      case 'news':
        return <Globe size={12} />;
      default:
        return <FileText size={12} />;
    }
  };

  const isProcessed = source.status === 'processed';
  const isInaccessible = source.status === 'inaccessible';

  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.85rem',
        background: 'rgba(17, 24, 39, 0.65)',
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              [{source.citationId || 'S?'}]
            </span>

            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
              {getTypeIcon(source.sourceType)}
              <span>{source.sourceType || 'web'}</span>
            </span>

            {source.subQuestionId && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {source.subQuestionId}
              </span>
            )}
          </div>

          <span
            className={`badge ${
              isProcessed ? 'badge-success' : isInaccessible ? 'badge-rose' : 'badge-amber'
            }`}
            style={{ fontSize: '0.68rem' }}
          >
            {isProcessed ? 'Verified Content' : isInaccessible ? 'Inaccessible (Snippet Only)' : 'Discovered'}
          </span>
        </div>

        {/* Source Title & Link */}
        <h4 style={{ fontSize: '0.95rem', lineHeight: 1.35, marginBottom: '0.4rem' }}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#f3f4f6', display: 'inline-flex', alignItems: 'flex-start', gap: '0.35rem' }}
          >
            <span>{source.title || 'Untitled Source'}</span>
            <ExternalLink size={13} style={{ flexShrink: 0, marginTop: '3px', color: '#94a3b8' }} />
          </a>
        </h4>

        {/* Domain & URL preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
          <Globe size={12} />
          <span>{source.domain || 'web'}</span>
        </div>

        {/* Snippet preview */}
        {source.snippet && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
            }}
          >
            {source.snippet}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Relevance: {Math.round((source.relevanceScore || 1.0) * 100)}%</span>
        {source.publishedDate && (
          <span>Published: {new Date(source.publishedDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
