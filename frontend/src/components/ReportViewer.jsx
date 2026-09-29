import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  BarChart3,
  AlertTriangle,
  BookOpen,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import ContradictionCard from './ContradictionCard.jsx';
import CitationModal from './CitationModal.jsx';

export default function ReportViewer({ report, sources = [] }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  if (!report) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No report generated yet. Run the research pipeline to view results.
      </div>
    );
  }

  // Create lookup map of sources by citationId e.g. "S1" -> source object
  const sourceLookup = new Map();
  for (const s of sources) {
    if (s.citationId) {
      sourceLookup.set(s.citationId.toUpperCase(), s);
      sourceLookup.set(`[${s.citationId.toUpperCase()}]`, s);
    }
  }
  if (Array.isArray(report.citations)) {
    for (const c of report.citations) {
      if (c.citationId && !sourceLookup.has(c.citationId.toUpperCase())) {
        sourceLookup.set(c.citationId.toUpperCase(), c);
        sourceLookup.set(`[${c.citationId.toUpperCase()}]`, c);
      }
    }
  }

  // Copy full report markdown to clipboard
  const handleCopy = async () => {
    const textToCopy = report.markdown || report.executiveSummary || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download markdown file
  const handleDownload = () => {
    const markdownContent = report.markdown || `# ${report.title}\n\n${report.executiveSummary}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(report.title || 'research-report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Click citation handler
  const handleCitationClick = (rawTag) => {
    const cleanId = rawTag.replace(/[\[\]]/g, '').trim().toUpperCase();
    const sourceObj = sourceLookup.get(cleanId);
    setSelectedCitation({ id: cleanId, source: sourceObj });
  };

  // Helper to render text with interactive inline [S#] badges
  const renderTextWithCitations = (text) => {
    if (!text || typeof text !== 'string') return text;

    const regex = /\[([Ss]\d+(?:\s*,\s*[Ss]\d+)*)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      const fullTag = match[0];
      const tagsGroup = match[1].split(',').map((t) => t.trim().toUpperCase());

      parts.push(
        <span key={`${matchIndex}-${fullTag}`} style={{ display: 'inline-flex', gap: '2px' }}>
          {tagsGroup.map((t) => (
            <button
              key={t}
              onClick={() => handleCitationClick(t)}
              className="citation-tag"
              title={`View source [${t}]`}
            >
              [{t}]
            </button>
          ))}
        </span>
      );

      lastIndex = matchIndex + fullTag.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const keyFindings = report.content?.keyFindings || [];
  const detailedAnalysis = report.content?.detailedAnalysis || [];
  const statistics = report.content?.statistics || [];
  const contradictions = report.content?.contradictions || [];
  const limitations = report.limitations || [];
  const citationsList = report.citations || [];

  const tabs = [
    { id: 'summary', label: 'Executive Summary', icon: FileText, count: null },
    { id: 'findings', label: 'Key Findings', icon: Sparkles, count: keyFindings.length },
    { id: 'analysis', label: 'Detailed Analysis', icon: Layers, count: detailedAnalysis.length },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, count: statistics.length },
    { id: 'contradictions', label: 'Contradictions', icon: AlertTriangle, count: contradictions.length },
    { id: 'limitations', label: 'Limitations', icon: Info, count: limitations.length },
    { id: 'references', label: 'Sources Catalog', icon: BookOpen, count: citationsList.length || sources.length },
  ];

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
      {/* Citation Popover Modal */}
      {selectedCitation && (
        <CitationModal
          citationId={selectedCitation.id}
          source={selectedCitation.source}
          onClose={() => setSelectedCitation(null)}
        />
      )}

      {/* Report Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Peer-Verified AI Report</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.25, color: '#ffffff' }}>
            {report.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export (.md)</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={15} color={isActive ? '#818cf8' : 'currentColor'} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === 'summary' && (
        <div className="fade-in">
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              lineHeight: 1.75,
              fontSize: '1rem',
              color: '#f1f5f9',
              marginBottom: '1.5rem',
            }}
          >
            {renderTextWithCitations(report.executiveSummary)}
          </div>

          {report.content?.conclusion && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              <h4 style={{ color: '#34d399', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                Strategic Conclusion
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                {renderTextWithCitations(report.content.conclusion)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Key Findings */}
      {activeTab === 'findings' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {keyFindings.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No key findings documented.</div>
          ) : (
            keyFindings.map((finding, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#ffffff' }}>
                    {idx + 1}. {finding.title}
                  </h4>
                  {Array.isArray(finding.citations) && (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {finding.citations.map((c) => (
                        <button key={c} onClick={() => handleCitationClick(c)} className="citation-tag">
                          [{c.replace(/[\[\]]/g, '')}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {renderTextWithCitations(finding.explanation)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Detailed Analysis by Sub-Question */}
      {activeTab === 'analysis' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {detailedAnalysis.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No detailed analysis breakdown available.</div>
          ) : (
            detailedAnalysis.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {item.subQuestionId || `Q${idx + 1}`}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                    {item.question}
                  </h3>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                  {renderTextWithCitations(item.analysis)}
                </div>

                {Array.isArray(item.citations) && item.citations.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Attributed Sources:</span>
                    {item.citations.map((c) => (
                      <button key={c} onClick={() => handleCitationClick(c)} className="citation-tag">
                        [{c.replace(/[\[\]]/g, '')}]
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Statistics & Quantified Metrics */}
      {activeTab === 'statistics' && (
        <div className="fade-in">
          {statistics.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No statistics extracted.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Metric / Indicator</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Extracted Value</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Empirical Context</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Source Citation</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#f3f4f6' }}>
                        {stat.metric || 'Quantified Metric'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {stat.value}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                        {stat.context}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {stat.sourceCitation ? (
                          <button
                            onClick={() => handleCitationClick(stat.sourceCitation)}
                            className="citation-tag"
                          >
                            {stat.sourceCitation}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Contradictions & Conflicts */}
      {activeTab === 'contradictions' && (
        <div className="fade-in">
          {contradictions.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: '#6ee7b7',
              }}
            >
              ✓ Consensus Verified: No direct empirical contradictions or irreconcilable claims were detected across the analyzed sources.
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                The Fact-Checker Agent identified {contradictions.length} points of contention across candidate sources:
              </div>
              {contradictions.map((c, idx) => (
                <ContradictionCard
                  key={idx}
                  contradiction={c}
                  onCitationClick={handleCitationClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Limitations */}
      {activeTab === 'limitations' && (
        <div className="fade-in">
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Empirical and methodological boundaries identified during synthesis:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {limitations.map((lim, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  color: '#e2e8f0',
                }}
              >
                <Info size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{lim}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Sources & References Catalog */}
      {activeTab === 'references' && (
        <div className="fade-in">
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Complete registry of genuine web sources consulted and cited in this report:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(citationsList.length > 0 ? citationsList : sources).map((src, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                  <button
                    onClick={() => handleCitationClick(src.citationId || `S${idx + 1}`)}
                    className="citation-tag"
                    style={{ fontSize: '0.85rem', padding: '0.2rem 0.55rem' }}
                  >
                    [{src.citationId || `S${idx + 1}`}]
                  </button>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                      {src.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {src.domain || 'web'} • Type: {src.sourceType || 'General'}
                    </div>
                  </div>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span>Open URL</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
