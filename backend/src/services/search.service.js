import { getSearchProvider, deduplicateResults } from '../providers/search/searchProvider.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class SearchService {
  /**
   * Execute search across multiple queries and produce deduplicated, citation-indexed sources
   * @param {Array<{ subQuestionId: string, query: string }>} searchTasks
   * @param {Object} options
   * @returns {Promise<Array<Object>>}
   */
  static async executeMultiQuerySearch(searchTasks = [], options = {}) {
    const provider = options.provider || (await getSearchProvider(options.providerType));
    const maxPerQuery = options.maxSourcesPerQuery || env.MAX_SOURCES_PER_QUERY || 5;
    const maxTotal = options.maxTotalSources || env.MAX_TOTAL_SOURCES || 20;

    logger.info('SEARCH', `Executing search across ${searchTasks.length} search tasks (provider: ${provider.name})`);

    const allDiscovered = [];

    for (const task of searchTasks) {
      try {
        const results = await provider.searchWeb(task.query, { maxResults: maxPerQuery });
        for (const item of results) {
          allDiscovered.push({
            ...item,
            subQuestionId: task.subQuestionId,
          });
        }
      } catch (err) {
        logger.warn('SEARCH', `Failed search query "${task.query}" for ${task.subQuestionId}: ${err.message}`);
      }
    }

    // Global session-level deduplication
    const uniqueSources = deduplicateResults(allDiscovered).slice(0, maxTotal);

    // Assign sequential citation IDs: S1, S2, S3...
    const indexedSources = uniqueSources.map((source, index) => ({
      ...source,
      citationId: `S${index + 1}`,
      status: 'discovered',
    }));

    logger.info(
      'SEARCH',
      `Completed search: discovered ${allDiscovered.length} raw results -> deduplicated to ${indexedSources.length} sources`
    );

    return indexedSources;
  }

  /**
   * Single query search
   */
  static async search(query, options = {}) {
    const provider = await getSearchProvider();
    const results = await provider.searchWeb(query, options);
    return deduplicateResults(results);
  }
}
