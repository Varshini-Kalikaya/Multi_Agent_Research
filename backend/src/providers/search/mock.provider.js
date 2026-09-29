import { SearchProvider, deduplicateResults, extractDomain, inferSourceType, normalizeUrl } from './searchProvider.js';
import { logger } from '../../utils/logger.js';

export class MockSearchProvider extends SearchProvider {
  constructor() {
    super('MockSearchProvider');
  }

  async searchWeb(query, options = {}) {
    logger.info('MOCK_SEARCH', `Executing mock search for query: "${query}"`);

    const maxResults = options.maxResults || 5;

    // Realistic curated evidence candidates for research workflows
    const candidates = [
      {
        title: 'NASSCOM Report: Generative AI and the Future of India Tech Workforce',
        url: 'https://nasscom.in/knowledge-center/publications/future-of-workforce-ai-2025',
        domain: 'nasscom.in',
        snippet: 'NASSCOM projects that 4.5 million IT professionals in India will require AI reskilling, while 1.2 million new specialized tech roles emerge by 2026.',
        publishedAt: '2025-01-15',
        sourceType: 'research',
        relevanceScore: 0.95,
      },
      {
        title: 'Economic Times: Impact of Artificial Intelligence on Employment in India',
        url: 'https://economictimes.indiatimes.com/tech/ites/ai-job-impact-india-trends/articleshow/10892341.cms?utm_source=feed&ref=tech',
        domain: 'economictimes.indiatimes.com',
        snippet: 'India entry-level software testing and customer service positions decline by 18%, whereas machine learning engineers see a 75% salary premium.',
        publishedAt: '2025-02-10',
        sourceType: 'news',
        relevanceScore: 0.91,
      },
      {
        title: 'NITI Aayog: National Strategy for Artificial Intelligence & Inclusive Employment',
        url: 'https://niti.gov.in/sites/default/files/2024-11/National-Strategy-AI-Employment.pdf',
        domain: 'niti.gov.in',
        snippet: 'Government policy focuses on AIRAWAT infrastructure and national reskilling missions across Tier-2 and Tier-3 Indian cities to counter automation risks.',
        publishedAt: '2024-11-20',
        sourceType: 'government',
        relevanceScore: 0.88,
      },
      {
        title: 'Brookings Institution: Global Labor Markets and Developing Nations AI Transition',
        url: 'https://brookings.edu/articles/ai-labor-market-transition-india-developing-economies/',
        domain: 'brookings.edu',
        snippet: 'Cross-national comparative analysis highlights that developing digital economies like India face acute white-collar BPO exposure compared to manufacturing.',
        publishedAt: '2024-12-05',
        sourceType: 'research',
        relevanceScore: 0.85,
      },
      {
        title: 'TechSparks Blog: How Startups in Bengaluru are Deploying Autonomous AI Agents',
        url: 'https://medium.com/techsparks/bengaluru-startups-ai-automation-2025-overview',
        domain: 'medium.com',
        snippet: 'Field interviews with 50 Indian founders revealing that junior coding velocity has tripled with agentic AI tooling, reducing entry hiring quotas.',
        publishedAt: '2025-03-01',
        sourceType: 'blog',
        relevanceScore: 0.78,
      },
      // Deliberate duplicate with different tracking parameters and trailing slash to verify deduplication
      {
        title: 'NASSCOM Report: Generative AI and the Future of India Tech Workforce',
        url: 'https://nasscom.in/knowledge-center/publications/future-of-workforce-ai-2025/?utm_medium=twitter&fbclid=XYZ123#overview',
        domain: 'nasscom.in',
        snippet: 'Duplicate URL testing NASSCOM report.',
        publishedAt: '2025-01-15',
        sourceType: 'research',
        relevanceScore: 0.95,
      },
    ];

    const sliced = candidates.slice(0, maxResults + 1);
    const normalized = sliced.map((item) => ({
      ...item,
      url: normalizeUrl(item.url),
      domain: extractDomain(item.url),
      sourceType: inferSourceType(item.url, item.domain),
    }));

    return deduplicateResults(normalized).slice(0, maxResults);
  }
}
