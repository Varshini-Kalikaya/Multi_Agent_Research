/**
 * Schema validator for Writer Agent output
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateResearchReport(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Report output must be an object'] };
  }

  // Title
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 5) {
    errors.push('Report title is required and must be at least 5 characters');
  }

  // Executive Summary
  if (!data.executiveSummary || typeof data.executiveSummary !== 'string' || data.executiveSummary.trim().length < 30) {
    errors.push('Executive summary is required and must be at least 30 characters');
  }

  // Key Findings
  if (!Array.isArray(data.keyFindings) || data.keyFindings.length === 0) {
    errors.push('keyFindings must be a non-empty array');
  } else {
    data.keyFindings.forEach((kf, i) => {
      if (!kf.title || typeof kf.title !== 'string') {
        errors.push(`keyFindings[${i}].title is required`);
      }
      if (!kf.explanation || typeof kf.explanation !== 'string') {
        errors.push(`keyFindings[${i}].explanation is required`);
      }
      if (!Array.isArray(kf.citations)) {
        errors.push(`keyFindings[${i}].citations must be an array of citation IDs`);
      }
    });
  }

  // Detailed Analysis
  if (!Array.isArray(data.detailedAnalysis) || data.detailedAnalysis.length === 0) {
    errors.push('detailedAnalysis must be a non-empty array covering sub-questions');
  } else {
    data.detailedAnalysis.forEach((da, i) => {
      if (!da.analysis || typeof da.analysis !== 'string') {
        errors.push(`detailedAnalysis[${i}].analysis is required`);
      }
      if (!Array.isArray(da.citations)) {
        errors.push(`detailedAnalysis[${i}].citations must be an array of citation IDs`);
      }
    });
  }

  // Statistics (optional array)
  if (data.statistics && !Array.isArray(data.statistics)) {
    errors.push('statistics must be an array');
  }

  // Contradictions (optional array)
  if (data.contradictions && !Array.isArray(data.contradictions)) {
    errors.push('contradictions must be an array');
  }

  // Limitations (optional array)
  if (data.limitations && !Array.isArray(data.limitations)) {
    errors.push('limitations must be an array of strings');
  }

  // Conclusion
  if (!data.conclusion || typeof data.conclusion !== 'string') {
    errors.push('conclusion must be a non-empty string');
  }

  // Markdown representation
  if (!data.markdown || typeof data.markdown !== 'string' || data.markdown.trim().length < 50) {
    errors.push('markdown must be a formatted markdown string of at least 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
