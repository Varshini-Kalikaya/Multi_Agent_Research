import { getAIProvider } from '../providers/ai/aiProvider.js';
import { FACT_CHECKER_SYSTEM_PROMPT, buildFactCheckerUserPrompt } from '../prompts/factChecker.prompt.js';
import { validateFactCheck } from '../validators/factCheck.validator.js';
import { Source } from '../models/Source.js';
import { SourceSummary } from '../models/SourceSummary.js';
import { FactCheck } from '../models/FactCheck.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { logger } from '../utils/logger.js';

export class FactCheckerAgent {
  constructor({ aiProvider = null } = {}) {
    this.name = 'FactCheckerAgent';
    this.aiProvider = aiProvider;
  }

  async getProvider() {
    if (!this.aiProvider) {
      this.aiProvider = await getAIProvider();
    }
    return this.aiProvider;
  }

  /**
   * Run FactChecker Agent across extracted source summaries and claims
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} [params.topic]
   * @param {Array<Object>} [params.summaries]
   * @param {Array<Object>} [params.sources]
   * @returns {Promise<Object>} FactCheck document
   */
  async run({ sessionId, topic = '', summaries = null, sources = null }, context = {}) {
    logger.info('FACT_CHECKER', `Starting cross-source fact checking`, { sessionId });

    let currentTopic = topic;

    if (sessionId) {
      const session = await ResearchSession.findById(sessionId);
      if (!currentTopic && session) currentTopic = session.topic;

      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.FACT_CHECKING,
        progress: 70,
        currentStep: 'Cross-referencing claims and detecting contradictory evidence...',
      });
    }

    // Load sources and summaries if not provided directly
    let targetSources = sources;
    if (!targetSources && sessionId) {
      targetSources = await Source.find({ sessionId }).lean();
    }

    let targetSummaries = summaries;
    if (!targetSummaries && sessionId) {
      targetSummaries = await SourceSummary.find({ sessionId }).lean();
    }

    if (!targetSummaries || targetSummaries.length === 0) {
      logger.warn('FACT_CHECKER', 'No source summaries available to fact check');
      const emptyResult = {
        sessionId,
        verifiedClaims: [],
        disputedClaims: [],
        unsupportedClaims: [],
        contradictions: [],
      };
      if (sessionId) {
        return await FactCheck.findOneAndUpdate({ sessionId }, emptyResult, { upsert: true, new: true });
      }
      return emptyResult;
    }

    const provider = await this.getProvider();

    // Map source citations for clean context
    const sourceMap = new Map();
    (targetSources || []).forEach((s) => {
      sourceMap.set(s._id?.toString(), s.citationId);
    });

    const contextualSummaries = targetSummaries.map((s) => ({
      citationId: sourceMap.get(s.sourceId?.toString()) || 'Unknown',
      summary: s.summary,
      keyClaims: s.keyClaims,
      statistics: s.statistics,
      limitations: s.limitations,
    }));

    const userPrompt = buildFactCheckerUserPrompt({
      topic: currentTopic,
      summaries: contextualSummaries,
      sources: targetSources || [],
    });

    logger.info('FACT_CHECKER', `Evaluating ${contextualSummaries.length} summaries for cross-verification`);

    const factCheckOutput = await provider.generateStructuredOutput({
      systemPrompt: FACT_CHECKER_SYSTEM_PROMPT,
      userPrompt,
      validator: validateFactCheck,
      temperature: 0.1,
      maxTokens: 3000,
    });

    let factCheckDoc = null;

    if (sessionId) {
      factCheckDoc = await FactCheck.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          verifiedClaims: factCheckOutput.verifiedClaims || [],
          disputedClaims: factCheckOutput.disputedClaims || [],
          unsupportedClaims: factCheckOutput.unsupportedClaims || [],
          contradictions: factCheckOutput.contradictions || [],
        },
        { upsert: true, new: true }
      );

      const contradictionCount = factCheckDoc.contradictions.length;
      const verifiedCount = factCheckDoc.verifiedClaims.length;

      await ResearchSession.findByIdAndUpdate(sessionId, {
        progress: 75,
        currentStep: `Detected ${contradictionCount} conflicting claims, verified ${verifiedCount} claims`,
      });

      logger.info('FACT_CHECKER', `Fact check completed: ${verifiedCount} verified, ${contradictionCount} contradictions`, {
        contradictions: contradictionCount,
      });

      return factCheckDoc;
    }

    return factCheckOutput;
  }
}
