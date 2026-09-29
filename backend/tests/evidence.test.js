import { connectDB, disconnectDB } from '../src/config/db.js';
import { ResearchSession } from '../src/models/ResearchSession.js';
import { Source, SourceStatus } from '../src/models/Source.js';
import { SourceSummary } from '../src/models/SourceSummary.js';
import { FactCheck } from '../src/models/FactCheck.js';
import { EvidenceService } from '../src/services/evidence.service.js';

async function runEvidenceTests() {
  console.log('--- Starting Phase 9 Evidence Aggregator Tests ---');
  let exitCode = 0;

  try {
    await connectDB();

    // -------------------------------------------------------------
    // TEST 1: In-Memory Evidence Aggregation & Structuring
    // -------------------------------------------------------------
    console.log('[TEST 1] In-Memory Evidence Aggregation');

    const mockSession = {
      _id: 'test-session-id',
      topic: 'AI Impact on Software Engineering',
      researchPlan: {
        objective: 'Determine how generative AI transforms software developer productivity.',
        subQuestions: [
          { id: 'SQ1', question: 'How much faster do developers write code with AI?', evidenceType: 'metrics' },
          { id: 'SQ2', question: 'What are the code quality and security implications?', evidenceType: 'analysis' },
        ],
      },
    };

    const mockSources = [
      {
        _id: 'src-1',
        citationId: 'S1',
        title: 'GitHub Copilot Productivity Study',
        url: 'https://github.blog/copilot-productivity',
        domain: 'github.blog',
        sourceType: 'industry_report',
        status: SourceStatus.PROCESSED,
        subQuestionId: 'SQ1',
      },
      {
        _id: 'src-2',
        citationId: 'S2',
        title: 'ACM Analysis on AI Code Security Vulnerabilities',
        url: 'https://acm.org/ai-security-review',
        domain: 'acm.org',
        sourceType: 'research',
        status: SourceStatus.PROCESSED,
        subQuestionId: 'SQ2',
      },
    ];

    const mockSummaries = [
      {
        sourceId: 'src-1',
        summary: 'Developers completed tasks 55% faster when assisted by generative AI pair programmers.',
        keyClaims: [
          { claim: 'Developers write code 55% faster with Copilot.', evidence: 'Empirical trial of 95 developers', importance: 'high' },
        ],
        statistics: [
          { value: '55%', context: 'task completion speedup' },
        ],
        limitations: ['Trial limited to Javascript and Python tasks.'],
      },
      {
        sourceId: 'src-2',
        summary: 'AI-generated code exhibits a 40% increase in common security vulnerabilities if not peer-reviewed.',
        keyClaims: [
          { claim: 'Unreviewed AI code introduces security vulnerabilities.', evidence: 'Static analysis of 10k code snippets', importance: 'high' },
        ],
        statistics: [
          { value: '40%', context: 'vulnerability prevalence increase' },
        ],
        limitations: ['Evaluated only against CWE top 25 vulnerabilities.'],
      },
    ];

    const mockFactCheck = {
      verifiedClaims: [
        {
          claim: 'AI tools measurably accelerate initial code generation speed',
          supportingSources: ['S1'],
          confidence: 'high',
          status: 'verified',
        },
      ],
      disputedClaims: [],
      unsupportedClaims: [],
      contradictions: [
        {
          claimA: 'AI code is production-ready out of the box',
          sourceA: '[S1]',
          claimB: 'AI code requires strict manual security validation',
          sourceB: '[S2]',
          explanation: 'Tension between velocity gains and security liabilities',
          resolution: 'Speed advantages require mandatory automated security linting',
        },
      ],
    };

    const inMemoryPkg = await EvidenceService.buildEvidencePackage({
      session: mockSession,
      sources: mockSources,
      summaries: mockSummaries,
      factCheck: mockFactCheck,
    });

    if (inMemoryPkg.subQuestions.length !== 2) {
      throw new Error(`Expected 2 grouped sub-questions, got ${inMemoryPkg.subQuestions.length}`);
    }
    if (inMemoryPkg.subQuestions[0].claims.length !== 1 || inMemoryPkg.subQuestions[0].claims[0].citationId !== 'S1') {
      throw new Error('Claims not properly linked to sub-question 1 with citationId S1');
    }
    if (inMemoryPkg.allStatistics.length !== 2) {
      throw new Error(`Expected 2 statistics across package, got ${inMemoryPkg.allStatistics.length}`);
    }
    if (inMemoryPkg.allLimitations.length !== 2) {
      throw new Error(`Expected 2 limitations across package, got ${inMemoryPkg.allLimitations.length}`);
    }
    if (inMemoryPkg.factCheck.contradictions.length !== 1) {
      throw new Error('Fact check contradictions not preserved in package');
    }
    console.log('✓ In-memory Evidence Package correctly grouped sub-questions, claims, and contradictions');

    // -------------------------------------------------------------
    // TEST 2: Writer Prompt Formatting
    // -------------------------------------------------------------
    console.log('[TEST 2] Writer Prompt Formatting');
    const formattedPrompt = EvidenceService.formatForWriterPrompt(inMemoryPkg);

    if (!formattedPrompt.includes('[S1]') || !formattedPrompt.includes('[S2]')) {
      throw new Error('Prompt formatting missing [S1] or [S2] source citation tags');
    }
    if (!formattedPrompt.includes('55%') || !formattedPrompt.includes('40%')) {
      throw new Error('Prompt formatting missing quantified statistics');
    }
    if (!formattedPrompt.includes('Identified Empirical Contradictions')) {
      throw new Error('Prompt formatting missing contradiction section');
    }
    console.log('✓ Formatted text contains citation registry, grouped claims, and contradictions');

    // -------------------------------------------------------------
    // TEST 3: MongoDB End-to-End Persistence Aggregation
    // -------------------------------------------------------------
    console.log('[TEST 3] MongoDB End-to-End Aggregation');

    const dbSession = await ResearchSession.create({
      topic: 'Renewable Energy Storage Breakthroughs',
      researchPlan: {
        researchTopic: 'Renewable Energy Storage Breakthroughs',
        objective: 'Assess modern battery chemistry advancements.',
        subQuestions: [
          { id: 'SQ1', question: 'What are solid-state battery energy densities?', evidenceType: 'scientific' },
        ],
      },
    });

    const dbSource = await Source.create({
      sessionId: dbSession._id,
      citationId: 'S1',
      title: 'Nature Materials: Solid-State Battery Density',
      url: 'https://nature.com/articles/solid-state-density',
      domain: 'nature.com',
      sourceType: 'research',
      status: SourceStatus.PROCESSED,
      subQuestionId: 'SQ1',
    });

    await SourceSummary.create({
      sessionId: dbSession._id,
      sourceId: dbSource._id,
      summary: 'Solid state electrolytes achieved 500 Wh/kg in laboratory trials.',
      keyClaims: [
        { claim: 'Solid state electrolytes achieve 500 Wh/kg.', evidence: 'Lab testing 2025', importance: 'high' },
      ],
      statistics: [
        { value: '500 Wh/kg', context: 'energy density achieved' },
      ],
      limitations: ['Commercial mass production unverified at scale.'],
    });

    await FactCheck.create({
      sessionId: dbSession._id,
      verifiedClaims: [
        {
          claim: 'Solid state batteries surpass traditional Li-ion density limits',
          supportingSources: ['S1'],
          confidence: 'high',
          status: 'verified',
        },
      ],
      disputedClaims: [],
      unsupportedClaims: [],
      contradictions: [],
    });

    const dbPackage = await EvidenceService.buildEvidencePackage({ sessionId: dbSession._id });

    if (dbPackage.sources.length !== 1 || dbPackage.sources[0].citationId !== 'S1') {
      throw new Error('Database source not properly loaded into evidence package');
    }
    if (dbPackage.subQuestions[0].claims.length !== 1) {
      throw new Error('Database claims not properly linked into sub-question');
    }
    if (dbPackage.stats.totalClaims !== 1 || dbPackage.stats.totalSources !== 1) {
      throw new Error('Package statistics mismatch');
    }
    console.log('✓ Successfully aggregated and structured MongoDB research data into Evidence Package');

    // Clean up test data
    await ResearchSession.findByIdAndDelete(dbSession._id);
    await Source.deleteMany({ sessionId: dbSession._id });
    await SourceSummary.deleteMany({ sessionId: dbSession._id });
    await FactCheck.deleteMany({ sessionId: dbSession._id });

    console.log('\n=============================================');
    console.log('ALL PHASE 9 EVIDENCE AGGREGATOR TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('Evidence tests failed:', err);
    exitCode = 1;
  } finally {
    await disconnectDB();
    process.exit(exitCode);
  }
}

runEvidenceTests();
