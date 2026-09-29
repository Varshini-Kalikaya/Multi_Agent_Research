/**
 * Validates the research plan returned by the Planner Agent
 * @param {Object} plan
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateResearchPlan = (plan) => {
  const errors = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Research plan must be a non-null JSON object'] };
  }

  // 1. Validate researchTopic
  if (!plan.researchTopic || typeof plan.researchTopic !== 'string' || !plan.researchTopic.trim()) {
    errors.push('Missing or empty researchTopic string');
  }

  // 2. Validate objective
  if (!plan.objective || typeof plan.objective !== 'string' || !plan.objective.trim()) {
    errors.push('Missing or empty objective string');
  }

  // 3. Validate subQuestions array
  if (!Array.isArray(plan.subQuestions)) {
    errors.push('subQuestions must be an array');
  } else if (plan.subQuestions.length < 2 || plan.subQuestions.length > 8) {
    errors.push(`subQuestions count (${plan.subQuestions.length}) must be between 2 and 6`);
  } else {
    // 4. Validate each sub-question
    plan.subQuestions.forEach((sq, idx) => {
      const prefix = `subQuestions[${idx}]`;

      if (!sq || typeof sq !== 'object') {
        errors.push(`${prefix} must be an object`);
        return;
      }

      if (!sq.id || typeof sq.id !== 'string') {
        errors.push(`${prefix} missing string id (e.g. "SQ${idx + 1}")`);
      }

      if (!sq.question || typeof sq.question !== 'string' || !sq.question.trim()) {
        errors.push(`${prefix} missing non-empty question`);
      }

      if (!Array.isArray(sq.searchQueries) || sq.searchQueries.length === 0) {
        errors.push(`${prefix} must have at least 1 search query in searchQueries`);
      } else {
        sq.searchQueries.forEach((q, qIdx) => {
          if (!q || typeof q !== 'string' || !q.trim()) {
            errors.push(`${prefix}.searchQueries[${qIdx}] must be a non-empty string`);
          }
        });
      }

      if (!sq.evidenceType || typeof sq.evidenceType !== 'string') {
        errors.push(`${prefix} missing evidenceType string`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
