import axios from 'axios';
import { SearchProvider, deduplicateResults, extractDomain, inferSourceType, normalizeUrl } from './searchProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { retryWithBackoff } from '../../utils/retry.js';
import { SearchProviderError } from '../../utils/errors.js';

export class TavilySearchProvider extends SearchProvider {
  constructor(config = {}) {
    super('TavilySearchProvider');
    this.apiKey = config.apiKey || env.TAVILY_API_KEY;
    this.baseURL = config.baseURL || 'https://api.tavily.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  async searchWeb(query, options = {}) {
    if (!this.apiKey) {
      throw new SearchProviderError(
        'TAVILY_API_KEY is not configured in .env. Please configure it or use mock provider for testing.'
      );
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const maxResults = options.maxResults || env.MAX_SOURCES_PER_QUERY || 5;

    const payload = {
      api_key: this.apiKey,
      query: query.trim(),
      search_depth: options.searchDepth || 'basic',
      include_answer: false,
      include_raw_content: false,
      max_results: maxResults,
    };

    return await retryWithBackoff(
      async (attempt) => {
        try {
          logger.debug('SEARCH_PROVIDER', `Calling Tavily search for: "${query}" (attempt ${attempt + 1})`);

          const response = await this.client.post('/search', payload);
          const rawResults = response.data?.results || [];

          const normalized = rawResults.map((item) => {
            const cleanUrl = normalizeUrl(item.url);
            const domain = extractDomain(cleanUrl);
            return {
              title: item.title || 'Untitled Source',
              url: cleanUrl,
              domain,
              snippet: item.content || '',
              publishedAt: item.published_date || null,
              sourceType: inferSourceType(cleanUrl, domain),
              relevanceScore: typeof item.score === 'number' ? item.score : 0.8,
            };
          });

          return deduplicateResults(normalized);
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            const errorMsg = error.response.data?.detail || error.message;

            if (status === 429 || status >= 500) {
              throw new SearchProviderError(`Tavily API error (${status}): ${errorMsg}`, error);
            }

            const fatalError = new SearchProviderError(`Tavily API rejected request (${status}): ${errorMsg}`, error);
            fatalError.isFatal = true;
            throw fatalError;
          }

          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new SearchProviderError('Tavily API request timed out', error);
          }

          throw new SearchProviderError(`Network or search error: ${error.message}`, error);
        }
      },
      {
        maxRetries: 2,
        baseDelayMs: 1500,
        shouldRetry: (err) => !err.isFatal,
        tag: 'TAVILY_SEARCH',
      }
    );
  }
}
