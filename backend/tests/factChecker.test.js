import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { FactCheckerAgent } from '../src/agents/factChecker.agent.js';
import { OrchestratorAgent } from '../src/agents/orchestrator.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { MockSearchProvider } from '../src/providers/search/mock.provider.js';
import { validateFactCheck } from '../src/validators/factCheck.validator.js';
import { ResearchSession, ResearchSessionStatus } from '../src/models/ResearchSession.js';
import { Source } from '../src/models/Source.js';
import { SourceSummary } from '../src/models/SourceSummary.js';
import { FactCheck } from '../src/models/FactCheck.js';

const runPhase8Tests = async () => {
  console.log('--- Starting Phase 8 Fact-Checker Agent Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // 1. Test Validator
    console.log('[TEST 1] FactCheck schema validator');
    const validFactCheck = {
      verifiedClaims: [{ claim: 'AI adoption is surging', supportingSources: ['S1', 'S2'], confidence: 'high', status: 'verified' }],
      disputedClaims: [{ claim: 'Net jobs will decrease', supportingSources: ['S1'], confidence: 'medium', status: 'disputed' }],
      unsupportedClaims: [],
      contradictions: [
        {
          claimA: 'Net IT workforce will shrink by 500k',
          sourceA: 'S1',
          claimB: 'Net IT workforce will expand by 1.2M',
          sourceB: 'S2',
          explanation: 'Divergent projections between industry survey and startup analysis',
          resolution: 'Automation displaces routine coding while higher-value engineering expands',
        },
      ],
    };
    const vRes = validateFactCheck(validFactCheck);
    if (!vRes.valid) throw new Error(`Valid factCheck failed: ${vRes.errors.join(', ')}`);
    console.log('✓ Valid fact-check payload passed validator');

    const badFactCheck = {
      verifiedClaims: [],
      contradictions: [{ claimA: 'Only claim A' }], // missing sourceA, claimB, sourceB, explanation
    };
    if (validateFactCheck(badFactCheck).valid) throw new Error('Incomplete contradiction should have failed');
    console.log('✓ Validator correctly rejected malformed contradiction data');

    // 2. Test FactChecker Agent with deliberately conflicting evidence
    console.log('[TEST 2] FactCheckerAgent with conflicting claims and verification');
    const mockAI = new MockAIProvider();
    const factChecker = new FactCheckerAgent({ aiProvider: mockAI });

    const session = await ResearchSession.create({
      topic: 'Impact of AI on employment in India',
      status: ResearchSessionStatus.SUMMARIZING,
      progress: 65,
    });

    const sources = [
      {
        _id: new mongoose.Types.ObjectId(),
        citationId: 'S1',
        title: 'Tech Employment Forecast 2025',
        url: 'https://example.com/s1',
        domain: 'example.com',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        citationId: 'S2',
        title: 'Startup Automation Index 2025',
        url: 'https://example.com/s2',
        domain: 'example.com',
      },
    ];

    const summaries = [
      {
        sourceId: sources[0]._id,
        summary: 'S1 projects strong workforce expansion.',
        keyClaims: [
          { claim: 'Net IT employment will expand by 1.2 million workers', importance: 'high' },
          { claim: 'Demand for AI prompt engineers and machine learning talent is surging in India', importance: 'high' },
        ],
        statistics: [{ value: '1.2M', context: 'net new jobs' }],
      },
      {
        sourceId: sources[1]._id,
        summary: 'S2 projects significant net job losses in entry software engineering.',
        keyClaims: [
          { claim: 'Net IT employment will shrink by 500,000 workers', importance: 'high' },
          { claim: 'Demand for AI prompt engineers and machine learning talent is surging in India', importance: 'high' },
        ],
        statistics: [{ value: '500k', context: 'job losses' }],
      },
    ];

    const factCheckResult = await factChecker.run({
      sessionId: session._id,
      topic: session.topic,
      summaries,
      sources,
    });

    if (!factCheckResult.contradictions || factCheckResult.contradictions.length === 0) {
      throw new Error('FactChecker failed to detect contradictions');
    }

    const c = factCheckResult.contradictions[0];
    if (!c.claimA || !c.sourceA || !c.claimB || !c.sourceB || !c.explanation) {
      throw new Error('Contradiction record missing essential comparative fields');
    }

    const refreshedSession = await ResearchSession.findById(session._id);
    if (refreshedSession.progress < 75) {
      throw new Error(`Expected progress >= 75, got ${refreshedSession.progress}`);
    }
    console.log(`✓ Detected ${factCheckResult.contradictions.length} direct contradictions between [${c.sourceA}] and [${c.sourceB}]`);
    console.log(`✓ Identified ${factCheckResult.verifiedClaims.length} verified claims across multiple sources`);
    console.log(`✓ Session progress reached ${refreshedSession.progress}% ("${refreshedSession.currentStep}")`);

    // 3. Test Full Auto-Pipeline Orchestration (Plan -> Search -> Summarize -> FactCheck)
    console.log('[TEST 3] OrchestratorAgent autonomous full pipeline up to FactCheck');
    const autoSession = await ResearchSession.create({
      topic: 'Impact of Robotics on Warehouse Logistics in India',
      status: ResearchSessionStatus.CREATED,
    });

    const orchestrator = new OrchestratorAgent({
      aiProvider: new MockAIProvider(),
      searchProvider: new MockSearchProvider(),
    });

    const autoResult = await orchestrator.factCheckSession(autoSession._id);
    if (!autoResult.factCheck) throw new Error('Auto fact-check failed');
    console.log(`✓ Full autonomous pipeline completed: Plan -> Search -> Summarize -> FactCheck`);

    // 4. Test REST API POST /api/research/:sessionId/fact-check
    console.log('[TEST 4] REST API endpoint (POST /api/research/:sessionId/fact-check)');
    const resFC = await fetch(`${baseUrl}/${session._id}/fact-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (resFC.status !== 200) {
      const errText = await resFC.text();
      throw new Error(`Expected 200 from /fact-check, got ${resFC.status}: ${errText}`);
    }

    const fcApiData = await resFC.json();
    if (!fcApiData.factCheck || !Array.isArray(fcApiData.factCheck.contradictions)) {
      throw new Error('API response missing factCheck contradictions');
    }
    console.log(`✓ REST API returned factCheck with ${fcApiData.factCheck.contradictions.length} contradictions, progress: ${fcApiData.progress}%`);

    // Clean up
    await Promise.all([
      ResearchSession.deleteMany({ _id: { $in: [session._id, autoSession._id] } }),
      Source.deleteMany({ sessionId: { $in: [session._id, autoSession._id] } }),
      SourceSummary.deleteMany({ sessionId: { $in: [session._id, autoSession._id] } }),
      FactCheck.deleteMany({ sessionId: { $in: [session._id, autoSession._id] } }),
    ]);

    console.log('\n=============================================');
    console.log('ALL PHASE 8 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Phase 8 test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPhase8Tests();
