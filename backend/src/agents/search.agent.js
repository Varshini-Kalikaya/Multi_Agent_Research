import { getSearchProvider, deduplicateResults } from '../providers/search/searchProvider.js';
import { runWithConcurrency } from '../utils/concurrency.js';
import { Source, SourceStatus } from '../models/Source.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class SearchAgent {
  constructor({ searchProvider = null, concurrencyLimit = 3 } = {}) {
    this.name = 'SearchAgent';
    this.searchProvider = searchProvider;
    this.concurrencyLimit = concurrencyLimit || env.MAX_CONCURRENT_LLM_CALLS || 3;
  }

  async getProvider() {
    if (!this.searchProvider) {
      this.searchProvider = await getSearchProvider();
    }
    return this.searchProvider;
  }

  /**
   * Run Search Agent to retrieve, deduplicate, and persist sources for each sub-question
   * @param {Object} params
   * @param {string} params.sessionId - MongoDB session ID
   * @param {Object} params.researchPlan - Validated research plan from Planner Agent
   * @param {Object} [context]
   * @returns {Promise<Array<Object>>} Saved Source documents
   */
  async run({ sessionId, researchPlan }, context = {}) {
    if (!researchPlan || !Array.isArray(researchPlan.subQuestions) || researchPlan.subQuestions.length === 0) {
      throw new Error('SearchAgent requires a researchPlan with at least one sub-question');
    }

    logger.info('SEARCH', `Starting source discovery across ${researchPlan.subQuestions.length} sub-questions`, {
      sessionId,
    });

    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.SEARCHING,
        progress: 25,
        currentStep: `Searching web for ${researchPlan.subQuestions.length} sub-questions...`,
      });
    }

    const provider = await this.getProvider();
    const maxPerQuery = env.MAX_SOURCES_PER_QUERY || 5;
    const maxTotal = env.MAX_TOTAL_SOURCES || 20;

    // Build discrete search tasks
    const searchTasks = [];
    researchPlan.subQuestions.forEach((sq) => {
      const queries = (sq.searchQueries || []).filter(Boolean);
      queries.forEach((query) => {
        searchTasks.push({
          subQuestionId: sq.id,
          query,
        });
      });
    });

    logger.info('SEARCH', `Compiled ${searchTasks.length} search queries with concurrency limit ${this.concurrencyLimit}`);

    // Execute queries with controlled concurrency
    const taskOutputs = await runWithConcurrency(searchTasks, this.concurrencyLimit, async (task) => {
      try {
        const results = await provider.searchWeb(task.query, { maxResults: maxPerQuery });
        return (results || []).map((r) => ({
          ...r,
          subQuestionId: task.subQuestionId,
        }));
      } catch (err) {
        logger.warn('SEARCH', `Query failed for "${task.query}": ${err.message}`);
        return [];
      }
    });

    // Flatten all discovered candidates
    const allCandidates = [];
    taskOutputs.forEach((output) => {
      if (Array.isArray(output)) {
        allCandidates.push(...output);
      }
    });

    logger.info('SEARCH', `Raw candidate sources retrieved: ${allCandidates.length}`);

    // Global session-level deduplication
    const uniqueCandidates = deduplicateResults(allCandidates).slice(0, maxTotal);

    // Save to MongoDB with sequential citation IDs
    const savedSources = [];

    if (sessionId) {
      // Find any existing sources for this session to maintain citation numbering
      const existingSources = await Source.find({ sessionId }).lean();
      const existingUrls = new Set(existingSources.map((s) => s.url));
      let nextCitationIndex = existingSources.length + 1;

      for (const item of uniqueCandidates) {
        if (existingUrls.has(item.url)) {
          continue;
        }

        try {
          const sourceDoc = await Source.create({
            sessionId,
            subQuestionId: item.subQuestionId,
            citationId: `S${nextCitationIndex}`,
            title: item.title,
            url: item.url,
            domain: item.domain,
            snippet: item.snippet || '',
            content: '', // to be populated during source processing in Phase 7
            sourceType: item.sourceType || 'unknown',
            publishedAt: item.publishedAt || null,
            relevanceScore: item.relevanceScore || 0.8,
            status: SourceStatus.DISCOVERED,
          });

          savedSources.push(sourceDoc);
          existingUrls.add(item.url);
          nextCitationIndex++;
        } catch (dbErr) {
          // If duplicate key error occurs, log and proceed
          if (dbErr.code === 11000) {
            logger.debug('SEARCH', `Skipping duplicate source URL: ${item.url}`);
          } else {
            logger.error('SEARCH', `Failed to insert source: ${dbErr.message}`);
          }
        }
      }

      // Update session state
      const totalSourcesCount = existingSources.length + savedSources.length;
      await ResearchSession.findByIdAndUpdate(sessionId, {
        progress: 40,
        currentStep: `Discovered and indexed ${totalSourcesCount} sources across ${researchPlan.subQuestions.length} sub-questions`,
      });

      logger.info('SEARCH', `Successfully persisted ${savedSources.length} new sources in MongoDB`, {
        totalSources: totalSourcesCount,
      });

      // Return all session sources
      return await Source.find({ sessionId }).sort({ citationId: 1 });
    }

    // In-memory return when running without database session
    return uniqueCandidates.map((c, idx) => ({
      ...c,
      citationId: `S${idx + 1}`,
      status: SourceStatus.DISCOVERED,
    }));
  }
}
