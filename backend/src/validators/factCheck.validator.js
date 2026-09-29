/**
 * Validates the fact-checking and contradiction detection output schema
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateFactCheck = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Fact-check output must be a non-null JSON object'] };
  }

  // 1. Validate verifiedClaims array
  if (!Array.isArray(data.verifiedClaims)) {
    errors.push('verifiedClaims must be an array');
  }

  // 2. Validate disputedClaims array
  if (!Array.isArray(data.disputedClaims)) {
    errors.push('disputedClaims must be an array');
  }

  // 3. Validate unsupportedClaims array
  if (!Array.isArray(data.unsupportedClaims)) {
    errors.push('unsupportedClaims must be an array');
  }

  // 4. Validate contradictions array
  if (!Array.isArray(data.contradictions)) {
    errors.push('contradictions must be an array');
  } else {
    data.contradictions.forEach((c, idx) => {
      const prefix = `contradictions[${idx}]`;
      if (!c || typeof c !== 'object') {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!c.claimA || typeof c.claimA !== 'string') errors.push(`${prefix} missing claimA`);
      if (!c.sourceA || typeof c.sourceA !== 'string') errors.push(`${prefix} missing sourceA citation`);
      if (!c.claimB || typeof c.claimB !== 'string') errors.push(`${prefix} missing claimB`);
      if (!c.sourceB || typeof c.sourceB !== 'string') errors.push(`${prefix} missing sourceB citation`);
      if (!c.explanation || typeof c.explanation !== 'string') errors.push(`${prefix} missing explanation`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
