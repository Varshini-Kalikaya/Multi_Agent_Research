import React from 'react';
import { AlertTriangle, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export default function ContradictionCard({ contradiction, onCitationClick }) {
  if (!contradiction) return null;

  const { claimA, sourceA, claimB, sourceB, explanation, resolution, topic } = contradiction;

  return (
    <div
      style={{
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div
          style={{
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
          }}
        >
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', color: '#fbbf24', fontWeight: 600 }}>
            {topic || 'Empirical Contradiction Detected'}
          </h4>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            Cross-source disagreement identified between source reports
          </p>
        </div>
      </div>

      {/* Side-by-Side or Stacked Claim Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Claim A */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Assertion 1</span>
            <button
              onClick={() => onCitationClick && onCitationClick(sourceA)}
              className="citation-tag"
            >
              {sourceA}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.4 }}>
            "{claimA}"
          </p>
        </div>

        {/* Claim B */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Assertion 2 (Conflicting)</span>
            <button
              onClick={() => onCitationClick && onCitationClick(sourceB)}
              className="citation-tag"
            >
              {sourceB}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.4 }}>
            "{claimB}"
          </p>
        </div>
      </div>

      {/* Explanation & Resolution */}
      <div style={{ fontSize: '0.825rem', lineHeight: 1.5, color: '#e2e8f0' }}>
        <p style={{ marginBottom: '0.4rem' }}>
          <strong style={{ color: '#fbbf24' }}>Discrepancy Analysis: </strong>
          {explanation}
        </p>
        {resolution && (
          <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: '#6ee7b7', marginTop: '0.5rem' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Synthesis: </strong>
              {resolution}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
