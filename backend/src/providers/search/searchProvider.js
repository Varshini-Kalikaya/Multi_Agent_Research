import { SearchProviderError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

/**
 * Normalizes a URL by removing trailing slashes, fragments, and tracking query params
 */
export const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    // Strip common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'msclkid', '_hsenc', '_hsmi', 'mc_cid', 'mc_eid'
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Strip hash fragment
    parsed.hash = '';

    let normalized = parsed.toString().toLowerCase();
    // Strip trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    // If URL parsing fails, return trimmed lowercase
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
};

/**
 * Extracts a clean domain hostname from a URL
 */
export const extractDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
};

/**
 * Infer source type heuristically based on domain and URL structure
 */
export const inferSourceType = (url, domain) => {
  const dom = (domain || extractDomain(url)).toLowerCase();

  if (dom.endsWith('.gov') || dom.includes('.gov.') || dom.includes('.nic.in') || dom.includes('niti.gov.in')) {
    return 'government';
  }

  if (
    dom.endsWith('.edu') ||
    dom.includes('.ac.') ||
    dom.includes('arxiv.org') ||
    dom.includes('sciencedirect.com') ||
    dom.includes('nature.com') ||
    dom.includes('ieee.org') ||
    dom.includes('researchgate.net') ||
    dom.includes('brookings.edu') ||
    dom.includes('nber.org') ||
    dom.includes('nasscom.in')
  ) {
    return 'research';
  }

  if (
    dom.includes('reuters.com') ||
    dom.includes('bloomberg.com') ||
    dom.includes('thehindu.com') ||
    dom.includes('economictimes.indiatimes.com') ||
    dom.includes('livemint.com') ||
    dom.includes('bbc.com') ||
    dom.includes('nytimes.com') ||
    dom.includes('indianexpress.com') ||
    dom.includes('news')
  ) {
    return 'news';
  }

  if (dom.includes('blog') || dom.includes('medium.com') || dom.includes('substack.com')) {
    return 'blog';
  }

  return 'company';
};

/**
 * Deduplicates search results by normalized URL and removes exact title duplicates
 */
export const deduplicateResults = (results = []) => {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const unique = [];

  for (const item of results) {
    if (!item.url) continue;

    const normUrl = normalizeUrl(item.url);
    const normTitle = (item.title || '').trim().toLowerCase();

    if (seenUrls.has(normUrl)) {
      continue;
    }

    if (normTitle && seenTitles.has(normTitle)) {
      continue;
    }

    seenUrls.add(normUrl);
    if (normTitle) seenTitles.add(normTitle);

    unique.push({
      ...item,
      url: normUrl,
      domain: item.domain || extractDomain(normUrl),
      sourceType: item.sourceType || inferSourceType(normUrl, item.domain),
    });
  }

  return unique;
};

/**
 * Abstract Base Search Provider Class
 */
export class SearchProvider {
  constructor(name = 'BaseSearchProvider') {
    if (this.constructor === SearchProvider) {
      throw new Error('SearchProvider is an abstract class and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Search web for query and return normalized results
   * @param {string} query
   * @param {Object} [options]
   * @param {number} [options.maxResults]
   * @returns {Promise<Array<{ title: string, url: string, domain: string, snippet: string, publishedAt: string|null, sourceType: string, relevanceScore: number }>>}
   */
  async searchWeb(query, options = {}) {
    throw new Error('searchWeb() must be implemented by subclass');
  }
}

/**
 * Search Provider Factory
 */
let cachedSearchProvider = null;

export const getSearchProvider = async (overrideType = null, forceNew = false) => {
  if (cachedSearchProvider && !overrideType && !forceNew) return cachedSearchProvider;

  const providerType = (overrideType || env.SEARCH_PROVIDER || 'tavily').toLowerCase();
  let provider = null;

  switch (providerType) {
    case 'tavily': {
      if (!env.TAVILY_API_KEY && !overrideType) {
        logger.warn(
          'SEARCH_PROVIDER',
          'TAVILY_API_KEY is not configured in .env. Falling back to MockSearchProvider for offline/test execution.'
        );
        const { MockSearchProvider } = await import('./mock.provider.js');
        provider = new MockSearchProvider();
      } else {
        const { TavilySearchProvider } = await import('./tavily.provider.js');
        provider = new TavilySearchProvider();
      }
      break;
    }
    case 'mock': {
      const { MockSearchProvider } = await import('./mock.provider.js');
      provider = new MockSearchProvider();
      break;
    }
    default: {
      logger.warn('SEARCH_PROVIDER', `Unknown SEARCH_PROVIDER "${providerType}", falling back to MockSearchProvider`);
      const { MockSearchProvider } = await import('./mock.provider.js');
      provider = new MockSearchProvider();
      break;
    }
  }

  logger.info('SEARCH_PROVIDER', `Initialized Search Provider: ${provider.name}`);
  if (!overrideType) {
    cachedSearchProvider = provider;
  }
  return provider;
};
