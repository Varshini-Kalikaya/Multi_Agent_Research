import { ResearchSession } from '../models/ResearchSession.js';
import { Source, SourceStatus } from '../models/Source.js';
import { SourceSummary } from '../models/SourceSummary.js';
import { FactCheck } from '../models/FactCheck.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class EvidenceService {
  /**
   * Aggregate all gathered research materials for a session into a structured Evidence Package
   * @param {Object} options
   * @param {string} [options.sessionId]
   * @param {Object} [options.session]
   * @param {Array<Object>} [options.sources]
   * @param {Array<Object>} [options.summaries]
   * @param {Object} [options.factCheck]
   * @returns {Promise<Object>} Aggregated Evidence Package
   */
  static async buildEvidencePackage({
    sessionId = null,
    session = null,
    sources = null,
    summaries = null,
    factCheck = null,
  } = {}) {
    logger.info('EVIDENCE_SERVICE', `Aggregating evidence package for session: ${sessionId || 'in-memory'}`);

    // 1. Resolve Session & Research Plan
    let activeSession = session;
    if (!activeSession && sessionId) {
      activeSession = await ResearchSession.findById(sessionId).lean();
      if (!activeSession) {
        throw new NotFoundError(`Research session ${sessionId} not found`);
      }
    }

    const topic = activeSession?.topic || 'Research Topic';
    const plan = activeSession?.researchPlan || {};
    const objective = plan.objective || `Analyze and synthesize findings regarding ${topic}`;
    const subQuestions = plan.subQuestions || [];

    // 2. Resolve Sources
    let activeSources = sources;
    if (!activeSources && sessionId) {
      activeSources = await Source.find({ sessionId }).lean();
    }
    activeSources = (activeSources || []).map((s) => {
      const base = typeof s.toObject === 'function' ? s.toObject() : s;
      return {
        _id: base._id?.toString() || base.id,
        citationId: base.citationId || 'S?',
        tag: `[${base.citationId || 'S?'}]`,
        title: base.title || 'Untitled Source',
        url: base.url || '',
        domain: base.domain || '',
        sourceType: base.sourceType || 'general',
        status: base.status || SourceStatus.DISCOVERED,
        subQuestionId: base.subQuestionId || '',
        publishedDate: base.publishedDate || null,
        relevanceScore: base.relevanceScore || 1.0,
      };
    });

    // Create lookup index by string ID and citationId
    const sourceById = new Map();
    const sourceByCitation = new Map();
    for (const src of activeSources) {
      if (src._id) sourceById.set(src._id.toString(), src);
      if (src.citationId) sourceByCitation.set(src.citationId, src);
    }

    // 3. Resolve Summaries
    let activeSummaries = summaries;
    if (!activeSummaries && sessionId) {
      activeSummaries = await SourceSummary.find({ sessionId }).lean();
    }
    activeSummaries = (activeSummaries || []).map((sum) => {
      const base = typeof sum.toObject === 'function' ? sum.toObject() : sum;
      const srcId = base.sourceId?.toString() || base.sourceId;
      const matchedSource = sourceById.get(srcId) || {};
      return {
        sourceId: srcId,
        citationId: matchedSource.citationId || base.citationId || 'S?',
        sourceTitle: matchedSource.title || 'Untitled Source',
        sourceUrl: matchedSource.url || '',
        summary: base.summary || '',
        keyClaims: base.keyClaims || [],
        statistics: base.statistics || [],
        limitations: base.limitations || [],
      };
    });

    const summaryBySourceId = new Map();
    for (const sum of activeSummaries) {
      summaryBySourceId.set(sum.sourceId, sum);
    }

    // 4. Resolve Fact-Check Intelligence
    let activeFactCheck = factCheck;
    if (!activeFactCheck && sessionId) {
      activeFactCheck = await FactCheck.findOne({ sessionId }).lean();
    }

    const verifiedClaims = activeFactCheck?.verifiedClaims || [];
    const disputedClaims = activeFactCheck?.disputedClaims || [];
    const unsupportedClaims = activeFactCheck?.unsupportedClaims || [];
    const contradictions = activeFactCheck?.contradictions || [];

    // 5. Group Evidence by Sub-Question
    const allStatistics = [];
    const allLimitations = new Set();

    const groupedSubQuestions = subQuestions.map((sq) => {
      // Find sources assigned to this subQuestion
      const sqSources = activeSources.filter((s) => s.subQuestionId === sq.id);

      // Collect claims from summaries belonging to this subQuestion's sources
      const sqClaims = [];
      const sqStats = [];

      for (const src of sqSources) {
        const sum = summaryBySourceId.get(src._id);
        if (sum) {
          if (Array.isArray(sum.keyClaims)) {
            for (const c of sum.keyClaims) {
              sqClaims.push({
                claim: c.claim,
                evidence: c.evidence,
                importance: c.importance || 'medium',
                citationId: src.citationId,
                sourceTag: src.tag,
                sourceTitle: src.title,
                sourceUrl: src.url,
              });
            }
          }

          if (Array.isArray(sum.statistics)) {
            for (const st of sum.statistics) {
              const statObj = {
                value: st.value,
                context: st.context,
                citationId: src.citationId,
                sourceTag: src.tag,
                sourceTitle: src.title,
              };
              sqStats.push(statObj);
              allStatistics.push(statObj);
            }
          }

          if (Array.isArray(sum.limitations)) {
            for (const lim of sum.limitations) {
              if (lim) allLimitations.add(lim);
            }
          }
        }
      }

      return {
        id: sq.id,
        question: sq.question,
        evidenceType: sq.evidenceType || 'general',
        searchQueries: sq.searchQueries || [],
        sources: sqSources,
        claims: sqClaims,
        statistics: sqStats,
      };
    });

    // Also collect statistics/limitations from sources not strictly matched to subQuestions
    for (const sum of activeSummaries) {
      if (Array.isArray(sum.limitations)) {
        for (const lim of sum.limitations) {
          if (lim) allLimitations.add(lim);
        }
      }
    }

    // 6. Build High-Integrity Evidence Package
    const evidencePackage = {
      sessionId: sessionId || activeSession?._id?.toString() || null,
      researchTopic: topic,
      objective,
      sources: activeSources,
      citationCatalog: activeSources.map((s) => ({
        citationId: s.citationId,
        tag: s.tag,
        title: s.title,
        url: s.url,
        domain: s.domain,
        sourceType: s.sourceType,
      })),
      subQuestions: groupedSubQuestions,
      summaries: activeSummaries,
      factCheck: {
        verifiedClaims,
        disputedClaims,
        unsupportedClaims,
        contradictions,
      },
      allStatistics,
      allLimitations: Array.from(allLimitations),
      stats: {
        totalSources: activeSources.length,
        accessibleSources: activeSources.filter((s) => s.status === SourceStatus.PROCESSED).length,
        totalSummaries: activeSummaries.length,
        totalClaims: activeSummaries.reduce((acc, s) => acc + (s.keyClaims?.length || 0), 0),
        verifiedClaimsCount: verifiedClaims.length,
        disputedClaimsCount: disputedClaims.length,
        contradictionsCount: contradictions.length,
      },
    };

    logger.info(
      'EVIDENCE_SERVICE',
      `Evidence package assembled: ${evidencePackage.stats.totalSources} sources, ${evidencePackage.stats.totalClaims} claims, ${evidencePackage.stats.contradictionsCount} contradictions`
    );

    return evidencePackage;
  }

  /**
   * Formats the Evidence Package into a structured readable text representation
   * tailored for the LLM Writer Agent prompt.
   * @param {Object} evidencePackage
   * @returns {string} Structured text
   */
  static formatForWriterPrompt(evidencePackage) {
    const lines = [];

    lines.push(`TOPIC: ${evidencePackage.researchTopic}`);
    lines.push(`OBJECTIVE: ${evidencePackage.objective}\n`);

    lines.push('--- SOURCE CITATION REGISTRY (Use ONLY these tags in citations) ---');
    for (const s of evidencePackage.sources) {
      lines.push(`${s.tag} "${s.title}" (${s.domain || 'web'}) - URL: ${s.url}`);
    }
    lines.push('');

    lines.push('--- EVIDENCE GROUPED BY SUB-QUESTION ---');
    for (const sq of evidencePackage.subQuestions) {
      lines.push(`\n[${sq.id}] ${sq.question} (Evidence Type: ${sq.evidenceType})`);
      lines.push(`Sources consulted: ${sq.sources.map((s) => s.tag).join(', ') || 'None'}`);

      if (sq.claims.length > 0) {
        lines.push('Key Claims:');
        for (const c of sq.claims) {
          lines.push(`  - ${c.sourceTag}: ${c.claim} (Evidence: "${c.evidence}", Importance: ${c.importance})`);
        }
      }

      if (sq.statistics.length > 0) {
        lines.push('Quantified Metrics:');
        for (const st of sq.statistics) {
          lines.push(`  - ${st.sourceTag}: ${st.value} (${st.context})`);
        }
      }
    }
    lines.push('');

    lines.push('--- CROSS-SOURCE VERIFICATION & CONTRADICTIONS ---');
    if (evidencePackage.factCheck.verifiedClaims.length > 0) {
      lines.push('Verified Consensus Claims:');
      for (const vc of evidencePackage.factCheck.verifiedClaims) {
        const sources = vc.supportingSources.map((s) => (s.startsWith('[') ? s : `[${s}]`)).join(', ');
        lines.push(`  - "${vc.claim}" | Sources: ${sources} (Confidence: ${vc.confidence})`);
      }
    }

    if (evidencePackage.factCheck.contradictions.length > 0) {
      lines.push('\nIdentified Empirical Contradictions:');
      for (const c of evidencePackage.factCheck.contradictions) {
        lines.push(`  - Claim 1 (${c.sourceA}): "${c.claimA}"`);
        lines.push(`    VS Claim 2 (${c.sourceB}): "${c.claimB}"`);
        lines.push(`    Explanation: ${c.explanation}`);
        if (c.resolution) lines.push(`    Reconciliation: ${c.resolution}`);
      }
    }

    if (evidencePackage.factCheck.disputedClaims.length > 0) {
      lines.push('\nDisputed / Conflicting Claims:');
      for (const dc of evidencePackage.factCheck.disputedClaims) {
        lines.push(`  - "${dc.claim}" (Notes: ${dc.notes || 'Disputed among sources'})`);
      }
    }

    if (evidencePackage.allLimitations.length > 0) {
      lines.push('\n--- RESEARCH LIMITATIONS IDENTIFIED ---');
      for (const lim of evidencePackage.allLimitations) {
        lines.push(`  - ${lim}`);
      }
    }

    return lines.join('\n');
  }
}
