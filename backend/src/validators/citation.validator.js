/**
 * Extracts all citation tags like [S1], [S2, S3], etc. from a text string
 * @param {string} text
 * @returns {string[]} Array of normalized citation IDs like ['S1', 'S2']
 */
export function extractCitationsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();
  // Match patterns like [S1], [S1, S2], [S12], [s1]
  const regex = /\[([Ss]\d+(?:\s*,\s*[Ss]\d+)*)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawGroup = match[1];
    const parts = rawGroup.split(',').map((p) => p.trim().toUpperCase());
    for (const p of parts) {
      if (p) found.add(p);
    }
  }

  return Array.from(found);
}

/**
 * Recursively extracts all citations found across all report fields
 * @param {Object} report
 * @returns {string[]} Array of unique citation IDs
 */
export function extractAllReportCitations(report) {
  const citations = new Set();

  function scan(obj) {
    if (!obj) return;
    if (typeof obj === 'string') {
      const extracted = extractCitationsFromText(obj);
      for (const id of extracted) citations.add(id);
    } else if (Array.isArray(obj)) {
      for (const item of obj) scan(item);
    } else if (typeof obj === 'object') {
      // Also check explicit citations arrays if present
      if (Array.isArray(obj.citations)) {
        for (const c of obj.citations) {
          if (typeof c === 'string') {
            const clean = c.replace(/[\[\]]/g, '').trim().toUpperCase();
            if (clean) citations.add(clean);
          }
        }
      }
      for (const key of Object.keys(obj)) {
        scan(obj[key]);
      }
    }
  }

  scan(report);
  return Array.from(citations).sort();
}

/**
 * Validates report citations against the catalog of genuine sources
 * @param {Object} params
 * @param {Object} params.report
 * @param {Array<Object>} params.sources
 * @returns {{ valid: boolean, invalidCitations: string[], citedSources: string[], uncitedSources: string[], errors: string[] }}
 */
export function validateCitations({ report, sources = [] }) {
  const errors = [];

  const validCitationIds = new Set(
    sources
      .map((s) => (s.citationId ? s.citationId.toUpperCase() : ''))
      .filter(Boolean)
  );

  const foundCitations = extractAllReportCitations(report);
  const invalidCitations = [];
  const citedSources = [];

  for (const cit of foundCitations) {
    if (!validCitationIds.has(cit)) {
      invalidCitations.push(cit);
      errors.push(`Invalid citation tag [${cit}] does not correspond to any known source in this session`);
    } else {
      citedSources.push(cit);
    }
  }

  const uncitedSources = Array.from(validCitationIds).filter(
    (id) => !citedSources.includes(id)
  );

  return {
    valid: invalidCitations.length === 0,
    invalidCitations,
    citedSources,
    uncitedSources,
    totalCitationsFound: foundCitations.length,
    validSourcesCount: validCitationIds.size,
    errors,
  };
}
