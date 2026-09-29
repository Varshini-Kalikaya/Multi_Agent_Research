import {
  SearchProvider,
  normalizeUrl,
  extractDomain,
  inferSourceType,
  deduplicateResults,
  getSearchProvider,
} from '../src/providers/search/searchProvider.js';
import { TavilySearchProvider } from '../src/providers/search/tavily.provider.js';
import { MockSearchProvider } from '../src/providers/search/mock.provider.js';
import { SearchService } from '../src/services/search.service.js';
import { SearchProviderError } from '../src/utils/errors.js';

const runPhase4Tests = async () => {
  console.log('--- Starting Phase 4 Search Provider Abstraction Tests ---');

  try {
    // 1. Test URL Normalization
    console.log('[TEST 1] URL Normalization & Sanitization');
    const dirtyUrl = 'https://example.com/research/ai-report/?utm_source=twitter&ref=feed&fbclid=123#overview';
    const cleanUrl = normalizeUrl(dirtyUrl);
    if (cleanUrl !== 'https://example.com/research/ai-report') {
      throw new Error(`Expected cleaned URL, got: "${cleanUrl}"`);
    }
    console.log('✓ Stripped tracking params, hashes, and trailing slashes correctly');

    // 2. Test Domain Extraction and Source Type Inference
    console.log('[TEST 2] Domain Extraction & Source Type Heuristics');
    if (extractDomain('https://www.niti.gov.in/reports') !== 'niti.gov.in') throw new Error('Domain extraction failed');
    if (inferSourceType('https://niti.gov.in/report', 'niti.gov.in') !== 'government') throw new Error('Gov type failed');
    if (inferSourceType('https://nasscom.in/insights', 'nasscom.in') !== 'research') throw new Error('Research type failed');
    if (inferSourceType('https://economictimes.indiatimes.com/tech', 'economictimes.indiatimes.com') !== 'news') throw new Error('News type failed');
    if (inferSourceType('https://medium.com/tech', 'medium.com') !== 'blog') throw new Error('Blog type failed');
    console.log('✓ Successfully extracted domains and inferred source types (government, research, news, blog)');

    // 3. Test Deduplication
    console.log('[TEST 3] Result Deduplication Logic');
    const duplicateList = [
      { title: 'AI in India', url: 'https://example.com/ai?utm_source=google', domain: 'example.com' },
      { title: 'AI in India', url: 'https://example.com/ai/', domain: 'example.com' }, // duplicate url and title
      { title: 'AI Policy', url: 'https://example.com/policy', domain: 'example.com' },
    ];
    const deduped = deduplicateResults(duplicateList);
    if (deduped.length !== 2) {
      throw new Error(`Expected 2 unique items, got ${deduped.length}`);
    }
    console.log('✓ Successfully deduplicated redundant search results');

    // 4. Test SearchProvider Abstract Class Enforcement
    console.log('[TEST 4] SearchProvider abstract contract enforcement');
    try {
      new SearchProvider();
      throw new Error('SearchProvider direct instantiation should have failed');
    } catch (err) {
      if (err.message.includes('abstract class')) {
        console.log('✓ Abstract class cannot be instantiated directly');
      } else {
        throw err;
      }
    }

    // 5. Test MockSearchProvider
    console.log('[TEST 5] MockSearchProvider execution');
    const mockProvider = new MockSearchProvider();
    const mockResults = await mockProvider.searchWeb('Impact of AI on Indian workforce');
    if (!Array.isArray(mockResults) || mockResults.length === 0) {
      throw new Error('Mock search returned no results');
    }
    const sample = mockResults[0];
    if (!sample.title || !sample.url || !sample.snippet || !sample.sourceType) {
      throw new Error('Result missing required normalized fields');
    }
    console.log(`✓ MockSearchProvider returned ${mockResults.length} normalized sources:`, {
      title: sample.title,
      domain: sample.domain,
      type: sample.sourceType,
    });

    // 6. Test Tavily Provider Error Handling
    console.log('[TEST 6] TavilySearchProvider unconfigured error handling');
    const unconfiguredTavily = new TavilySearchProvider({ apiKey: '' });
    try {
      await unconfiguredTavily.searchWeb('Test query');
      throw new Error('Expected unconfigured Tavily to throw');
    } catch (err) {
      if (err instanceof SearchProviderError && err.message.includes('TAVILY_API_KEY')) {
        console.log('✓ Unconfigured TavilySearchProvider throws actionable SearchProviderError');
      } else {
        throw err;
      }
    }

    // Live search if TAVILY_API_KEY is present
    if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.startsWith('tvly-')) {
      console.log('[TEST 6b] Testing live Tavily search API');
      const liveTavily = new TavilySearchProvider();
      const liveResults = await liveTavily.searchWeb('AI employment India');
      console.log(`✓ Live Tavily search succeeded with ${liveResults.length} results`);
    }

    // 7. Test SearchService multi-query orchestration & sequential citation IDs
    console.log('[TEST 7] SearchService multi-query aggregation and citation indexing');
    // Test with mock provider for deterministic test
    const searchTasks = [
      { subQuestionId: 'SQ1', query: 'AI job displacement in India' },
      { subQuestionId: 'SQ2', query: 'Emerging AI roles NASSCOM India' },
    ];
    const indexedSources = await SearchService.executeMultiQuerySearch(searchTasks, {
      providerType: 'mock',
      maxSourcesPerQuery: 3,
      maxTotalSources: 6,
    });

    if (indexedSources.length < 2) throw new Error('SearchService returned insufficient sources');
    if (indexedSources[0].citationId !== 'S1' || indexedSources[1].citationId !== 'S2') {
      throw new Error('Citation indexing failed');
    }
    console.log(`✓ SearchService produced ${indexedSources.length} sequentially indexed citations ([S1], [S2]...)`);

    console.log('\n=============================================');
    console.log('ALL PHASE 4 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Phase 4 test failed:', error);
    process.exit(1);
  }
};

runPhase4Tests();
