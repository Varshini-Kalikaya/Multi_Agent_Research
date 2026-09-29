import { getAIProvider } from '../providers/ai/aiProvider.js';
import { SUMMARIZER_SYSTEM_PROMPT, buildSummarizerUserPrompt } from '../prompts/summarizer.prompt.js';
import { validateSourceSummary } from '../validators/summary.validator.js';
import { SourceService } from '../services/source.service.js';
import { runWithConcurrency } from '../utils/concurrency.js';
import { Source, SourceStatus } from '../models/Source.js';
import { SourceSummary } from '../models/SourceSummary.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class SummarizerAgent {
  constructor({ aiProvider = null, concurrencyLimit = 3 } = {}) {
    this.name = 'SummarizerAgent';
    this.aiProvider = aiProvider;
    this.concurrencyLimit = concurrencyLimit || env.MAX_CONCURRENT_LLM_CALLS || 3;
  }

  async getProvider() {
    if (!this.aiProvider) {
      this.aiProvider = await getAIProvider();
    }
    return this.aiProvider;
  }

  /**
   * Concurrently retrieve and clean full-text content for an array of sources
   * @param {Array<Object>} sources
   * @returns {Promise<Array<Object>>} Updated sources with content and status
   */
  async processSourcesContent(sources = []) {
    logger.info('SUMMARIZER', `Processing and cleaning web content for ${sources.length} sources (concurrency: ${this.concurrencyLimit})`);

    const processed = await runWithConcurrency(sources, this.concurrencyLimit, async (source) => {
      // If content is already present (e.g. preloaded or in-memory test), ensure status is PROCESSED
      if (source.content && source.content.length > 50) {
        if (source.status !== SourceStatus.PROCESSED && source._id) {
          await Source.findByIdAndUpdate(source._id, { status: SourceStatus.PROCESSED });
        }
        const base = typeof source.toObject === 'function' ? source.toObject() : source;
        return {
          ...base,
          status: SourceStatus.PROCESSED,
        };
      }

      const result = await SourceService.fetchAndClean(source.url);

      let finalContent = result.content;
      let finalStatus = result.status;

      // If page is inaccessible but search provided a rich snippet, utilize snippet
      if (!result.success || !finalContent) {
        if (source.snippet && source.snippet.length >= 80) {
          finalContent = `[Snippet Excerpt from Search]:\n${source.snippet}`;
          finalStatus = SourceStatus.PROCESSED;
        } else {
          finalStatus = SourceStatus.INACCESSIBLE;
          finalContent = '';
        }
      }

      // Persist content and updated status to MongoDB
      if (source._id) {
        await Source.findByIdAndUpdate(source._id, {
          content: finalContent,
          status: finalStatus,
        });
      }

      const base = typeof source.toObject === 'function' ? source.toObject() : source;
      return {
        ...base,
        content: finalContent,
        status: finalStatus,
      };
    });

    const accessible = processed.filter((s) => s.status === SourceStatus.PROCESSED);
    const inaccessible = processed.filter((s) => s.status === SourceStatus.INACCESSIBLE);

    logger.info(
      'SUMMARIZER',
      `Content retrieval completed: ${accessible.length} accessible, ${inaccessible.length} marked inaccessible`
    );

    return processed;
  }

  /**
   * Summarize an individual accessible source and extract claims/statistics
   * @param {Object} params
   * @returns {Promise<Object|null>} SourceSummary document or null if inaccessible
   */
  async summarizeSingleSource({ source, topic, subQuestion = '' }) {
    if (source.status === SourceStatus.INACCESSIBLE || !source.content || source.content.length < 30) {
      logger.info('SUMMARIZER', `Skipping summary for inaccessible source [${source.citationId}]: ${source.url}`);
      return null;
    }

    const provider = await this.getProvider();
    const safeTitle = source.title || 'Untitled Source';
    const safeTopic = topic || 'General Research';

    const userPrompt = buildSummarizerUserPrompt({
      topic: safeTopic,
      subQuestion: subQuestion || source.subQuestionId || 'General',
      sourceId: source.citationId || source._id?.toString() || 'S?',
      sourceTitle: safeTitle,
      sourceUrl: source.url || '',
      sourceContent: source.content,
    });

    logger.info('SUMMARIZER', `Generating structured summary for [${source.citationId}]: "${safeTitle.slice(0, 50)}..."`);

    const extracted = await provider.generateStructuredOutput({
      systemPrompt: SUMMARIZER_SYSTEM_PROMPT,
      userPrompt,
      validator: validateSourceSummary,
      temperature: 0.2,
      maxTokens: 2000,
    });

    let summaryDoc = null;

    if (source.sessionId && source._id) {
      summaryDoc = await SourceSummary.findOneAndUpdate(
        { sessionId: source.sessionId, sourceId: source._id },
        {
          sessionId: source.sessionId,
          sourceId: source._id,
          summary: extracted.summary,
          keyClaims: extracted.keyClaims || [],
          statistics: extracted.statistics || [],
          limitations: extracted.limitations || [],
        },
        { upsert: true, new: true }
      );
      logger.info('SUMMARIZER', `Source summary persisted for [${source.citationId}] (${summaryDoc.keyClaims.length} claims extracted)`);
    } else {
      summaryDoc = {
        sourceId: source._id || source.citationId,
        ...extracted,
      };
    }

    return summaryDoc;
  }

  /**
   * Full execution: content processing + concurrent claim extraction
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {Array<Object>} [params.sources]
   * @param {string} [params.topic]
   * @returns {Promise<{ summaries: Array, processedSources: Array }>}
   */
  async run({ sessionId, sources = null, topic = '' }, context = {}) {
    let session = null;
    if (sessionId) {
      session = await ResearchSession.findById(sessionId);
      if (!topic && session) topic = session.topic;

      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.PROCESSING_SOURCES,
        progress: 45,
        currentStep: 'Retrieving and cleaning source content...',
      });
    }

    // Load sources from database if not provided directly
    let targetSources = sources;
    if (!targetSources && sessionId) {
      targetSources = await Source.find({ sessionId }).lean();
    }

    if (!targetSources || targetSources.length === 0) {
      logger.warn('SUMMARIZER', 'No sources available to process or summarize');
      return { summaries: [], processedSources: [] };
    }

    // 1. Process and clean full text for all sources
    const processedSources = await this.processSourcesContent(targetSources);

    // Filter accessible sources for summarization
    const accessible = processedSources.filter((s) => s.status === SourceStatus.PROCESSED);

    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.SUMMARIZING,
        progress: 50,
        currentStep: `Summarizing ${accessible.length} accessible sources...`,
      });
    }

    // 2. Concurrently summarize all accessible sources
    let completedCount = 0;
    const summaryResults = await runWithConcurrency(accessible, this.concurrencyLimit, async (source, index) => {
      const summary = await this.summarizeSingleSource({
        source,
        topic,
        subQuestion: source.subQuestionId,
      });

      completedCount++;
      if (sessionId) {
        const stepProgress = Math.min(65, 50 + Math.floor((completedCount / accessible.length) * 15));
        await ResearchSession.findByIdAndUpdate(sessionId, {
          progress: stepProgress,
          currentStep: `Summarizing source ${completedCount} of ${accessible.length} ([${source.citationId}])`,
        });
      }

      return summary;
    });

    const validSummaries = summaryResults.filter(Boolean);

    logger.info('SUMMARIZER', `Summarization phase complete: ${validSummaries.length} summaries generated`);

    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        progress: 65,
        currentStep: `Extracted claims and statistics from ${validSummaries.length} sources`,
      });
    }

    return {
      summaries: validSummaries,
      processedSources,
      accessibleCount: accessible.length,
      inaccessibleCount: processedSources.length - accessible.length,
    };
  }
}
