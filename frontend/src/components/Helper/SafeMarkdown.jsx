import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Single Code Block with Syntax Styling, Language Tag, and One-Click Copy
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard', err);
    }
  };

  return (
    <div className="helper-codeblock">
      <div className="helper-codeblock-header">
        <span className="helper-codeblock-lang">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="helper-codeblock-copy-btn"
          aria-label="Copy code to clipboard"
          type="button"
        >
          {copied ? (
            <>
              <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ color: 'var(--accent-emerald)' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="helper-codeblock-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Format inline text styles (bold, italic, inline code)
 */
function formatInlineText(text) {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, i) => {
    if (codePart.startsWith('`') && codePart.endsWith('`')) {
      return (
        <code key={i} className="helper-inline-code">
          {codePart.slice(1, -1)}
        </code>
      );
    }

    // Split by bold: **bold**
    const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldPart, j) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return (
          <strong key={`${i}-${j}`} className="helper-bold">
            {boldPart.slice(2, -2)}
          </strong>
        );
      }

      // Split by italic: *italic*
      const italicParts = boldPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((italicPart, k) => {
        if (italicPart.startsWith('*') && italicPart.endsWith('*')) {
          return (
            <em key={`${i}-${j}-${k}`} className="helper-italic">
              {italicPart.slice(1, -1)}
            </em>
          );
        }
        return italicPart;
      });
    });
  });
}

/**
 * Safe, zero-dependency Markdown Renderer
 * Parses code blocks, headers, bullet/ordered lists, blockquotes, and tables without dangerous HTML injection
 */
export default function SafeMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let currentLanguage = '';
  let inTable = false;
  let tableRows = [];

  const flushTable = (key) => {
    if (tableRows.length === 0) return null;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(1).filter(r => !r.every(c => c.match(/^:?-+:?$/)));

    const el = (
      <div key={`table-${key}`} className="helper-table-wrapper">
        <table className="helper-table">
          <thead>
            <tr>
              {headerRow.map((col, idx) => (
                <th key={idx}>{formatInlineText(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((col, cIdx) => (
                  <td key={cIdx}>{formatInlineText(col)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return el;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block Toggle
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Close table if open
        if (inTable) {
          const tbl = flushTable(i);
          if (tbl) elements.push(tbl);
        }
        inCodeBlock = true;
        currentLanguage = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            language={currentLanguage}
            code={codeBuffer.join('\n')}
          />
        );
        codeBuffer = [];
        currentLanguage = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table Detection (line starts and ends with |)
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const columns = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(columns);
      continue;
    } else if (inTable) {
      const tbl = flushTable(i);
      if (tbl) elements.push(tbl);
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="helper-heading-3">
          {formatInlineText(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="helper-heading-2">
          {formatInlineText(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="helper-heading-1">
          {formatInlineText(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="helper-divider" />);
      continue;
    }

    // Unordered List (- or *)
    if (line.match(/^\s*[-*]\s+/)) {
      const indent = line.search(/\S/);
      const text = line.replace(/^\s*[-*]\s+/, '');
      elements.push(
        <div
          key={`ul-${i}`}
          className="helper-list-item"
          style={{ paddingLeft: `${Math.max(0, indent) * 0.5 + 0.5}rem` }}
        >
          <span className="helper-bullet">•</span>
          <span className="helper-list-content">{formatInlineText(text)}</span>
        </div>
      );
      continue;
    }

    // Ordered List (1. )
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (olMatch) {
      const num = olMatch[2];
      const text = olMatch[3];
      elements.push(
        <div key={`ol-${i}`} className="helper-list-item">
          <span className="helper-number">{num}.</span>
          <span className="helper-list-content">{formatInlineText(text)}</span>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="helper-blockquote">
          {formatInlineText(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Empty Line
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} className="helper-paragraph-spacing" />);
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="helper-paragraph">
        {formatInlineText(line)}
      </p>
    );
  }

  // Flush trailing table if file ended inside a table
  if (inTable) {
    const tbl = flushTable(lines.length);
    if (tbl) elements.push(tbl);
  }

  // Flush trailing open code block if any
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key={`code-tail`}
        language={currentLanguage}
        code={codeBuffer.join('\n')}
      />
    );
  }

  return <div className="helper-markdown-body">{elements}</div>;
}
