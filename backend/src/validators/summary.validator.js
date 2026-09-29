/**
 * Validates the extracted source summary schema returned by the Summarizer Agent
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateSourceSummary = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Summary data must be a non-null object'] };
  }

  // 1. Validate summary text
  if (!data.summary || typeof data.summary !== 'string' || !data.summary.trim()) {
    errors.push('Missing or empty summary text');
  }

  // 2. Validate keyClaims
  if (!Array.isArray(data.keyClaims) || data.keyClaims.length === 0) {
    errors.push('keyClaims must be a non-empty array of claim objects');
  } else {
    data.keyClaims.forEach((kc, idx) => {
      const prefix = `keyClaims[${idx}]`;
      if (!kc || typeof kc !== 'object') {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!kc.claim || typeof kc.claim !== 'string' || !kc.claim.trim()) {
        errors.push(`${prefix} missing non-empty claim`);
      }
      if (!kc.importance || !['high', 'medium', 'low'].includes(kc.importance.toLowerCase())) {
        errors.push(`${prefix} importance must be "high", "medium", or "low"`);
      }
    });
  }

  // 3. Validate statistics (optional array)
  if (data.statistics && !Array.isArray(data.statistics)) {
    errors.push('statistics must be an array');
  } else if (Array.isArray(data.statistics)) {
    data.statistics.forEach((stat, idx) => {
      const prefix = `statistics[${idx}]`;
      if (!stat || typeof stat !== 'object') {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!stat.value || typeof stat.value !== 'string') {
        errors.push(`${prefix} missing string value`);
      }
    });
  }

  // 4. Validate limitations (optional array of strings)
  if (data.limitations && !Array.isArray(data.limitations)) {
    errors.push('limitations must be an array of strings');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
