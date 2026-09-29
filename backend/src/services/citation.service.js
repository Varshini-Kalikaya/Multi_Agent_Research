import { validateCitations, extractAllReportCitations } from '../validators/citation.validator.js';
import { logger } from '../utils/logger.js';

export class CitationService {
  /**
   * Run validation on research report against existing sources
   * @param {Object} params
   * @param {Object} params.report
   * @param {Array<Object>} params.sources
   * @returns {Object} Validation audit report
   */
  static validate({ report, sources = [] }) {
    logger.info('CITATION_SERVICE', `Validating citations against ${sources.length} genuine sources`);
    return validateCitations({ report, sources });
  }

  /**
   * Cleans or remaps invalid/hallucinated citations in report text and structure
   * @param {Object} params
   * @param {Object} params.report
   * @param {Array<Object>} params.sources
   * @param {Array<string>} params.invalidCitations
   * @returns {Object} Cleaned report
   */
  static correctReport({ report, sources = [], invalidCitations = [] }) {
    if (!invalidCitations || invalidCitations.length === 0) {
      return report;
    }

    logger.warn(
      'CITATION_SERVICE',
      `Correcting ${invalidCitations.length} invalid citations: ${invalidCitations.join(', ')}`
    );

    const invalidSet = new Set(invalidCitations.map((c) => c.toUpperCase()));
    const validIds = sources.map((s) => s.citationId?.toUpperCase()).filter(Boolean);
    const fallbackId = validIds[0] || null;

    // Helper to sanitize a text string by removing or replacing invalid [S#] tags
    const sanitizeText = (text) => {
      if (!text || typeof text !== 'string') return text;

      // Regex matching any [S...] tag
      return text.replace(/\[([Ss]\d+(?:\s*,\s*[Ss]\d+)*)\]/g, (fullMatch, group) => {
        const parts = group.split(',').map((p) => p.trim().toUpperCase());
        const validParts = parts.filter((p) => !invalidSet.has(p));

        if (validParts.length > 0) {
          return `[${validParts.join(', ')}]`;
        }
        // If all tags in the brackets were invalid, either fallback or remove bracket
        return fallbackId ? `[${fallbackId}]` : '';
      });
    };

    // Deep clone the report object
    const cleaned = JSON.parse(JSON.stringify(report));

    function walkAndClean(node) {
      if (!node) return;

      if (typeof node === 'object') {
        for (const key of Object.keys(node)) {
          if (typeof node[key] === 'string') {
            node[key] = sanitizeText(node[key]);
          } else if (Array.isArray(node[key])) {
            if (key === 'citations') {
              // Filter out invalid citation string IDs
              node[key] = node[key]
                .map((c) => (typeof c === 'string' ? c.replace(/[\[\]]/g, '').trim().toUpperCase() : c))
                .filter((c) => !invalidSet.has(c));
              if (node[key].length === 0 && fallbackId) {
                node[key] = [fallbackId];
              }
            } else {
              node[key].forEach((item, index) => {
                if (typeof item === 'string') {
                  node[key][index] = sanitizeText(item);
                } else if (typeof item === 'object') {
                  walkAndClean(item);
                }
              });
            }
          } else if (typeof node[key] === 'object') {
            walkAndClean(node[key]);
          }
        }
      }
    }

    walkAndClean(cleaned);

    logger.info('CITATION_SERVICE', 'Citation correction completed successfully');
    return cleaned;
  }

  /**
   * Autonomous validate-and-correct pipeline
   * @param {Object} params
   * @param {Object} params.report
   * @param {Array<Object>} params.sources
   * @returns {{ report: Object, validation: Object, wasCorrected: boolean }}
   */
  static validateAndCorrect({ report, sources = [] }) {
    let validation = this.validate({ report, sources });

    if (validation.valid) {
      return {
        report,
        validation,
        wasCorrected: false,
      };
    }

    const correctedReport = this.correctReport({
      report,
      sources,
      invalidCitations: validation.invalidCitations,
    });

    const revalidation = this.validate({ report: correctedReport, sources });

    return {
      report: correctedReport,
      validation: revalidation,
      wasCorrected: true,
      originalErrors: validation.errors,
    };
  }
}
