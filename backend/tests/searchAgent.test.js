import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { SearchAgent } from '../src/agents/search.agent.js';
import { OrchestratorAgent } from '../src/agents/orchestrator.agent.js';
import { MockSearchProvider } from '../src/providers/search/mock.provider.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { runWithConcurrency } from '../src/utils/concurrency.js';
import { ResearchSession, ResearchSessionStatus } from '../src/models/ResearchSession.js';
import { Source } from '../src/models/Source.js';

const runPhase6Tests = async () => {
  console.log('--- Starting Phase 6 Search Agent Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // 1. Test Concurrency Utility
    console.log('[TEST 1] Concurrency control utility (runWithConcurrency)');
    let activeTasks = 0;
    let maxSimultaneous = 0;
    const testTasks = [1, 2, 3, 4, 5, 6];

    const results = await runWithConcurrency(testTasks, 2, async (task) => {
      activeTasks++;
      if (activeTasks > maxSimultaneous) maxSimultaneous = activeTasks;
      await new Promise((r) => setTimeout(r, 20));
      activeTasks--;
      return task * 2;
    });

    if (maxSimultaneous > 2) throw new Error(`Concurrency exceeded limit 2: reached ${maxSimultaneous}`);
    if (results.length !== 6 || results[0] !== 2 || results[5] !== 12) {
      throw new Error('Concurrency worker returned invalid results');
    }
    console.log(`✓ Concurrency limit strictly enforced (max active: ${maxSimultaneous}, processed: ${results.length})`);

    // 2. Test Search Agent with Mock Search Provider & Session
    console.log('[TEST 2] SearchAgent execution, deduplication & MongoDB persistence');
    const mockSearch = new MockSearchProvider();
    const searchAgent = new SearchAgent({ searchProvider: mockSearch, concurrencyLimit: 2 });

    const session = await ResearchSession.create({
      topic: 'Impact of AI on employment in India',
      status: ResearchSessionStatus.PLANNING,
      researchPlan: {
        researchTopic: 'Impact of AI on employment in India',
        objective: 'Analyze tech labor market transformation in India',
        subQuestions: [
          {
            id: 'SQ1',
            question: 'What are current displacement trends?',
            searchQueries: ['AI displacement trends India tech', 'Generative AI IT job loss India'],
            evidenceType: 'statistics',
          },
          {
            id: 'SQ2',
            question: 'What are emerging high-demand roles?',
            searchQueries: ['Emerging AI roles NASSCOM India', 'Machine learning hiring surge India'],
            evidenceType: 'reports',
          },
        ],
      },
    });

    const sources = await searchAgent.run({
      sessionId: session._id,
      researchPlan: session.researchPlan,
    });

    if (!Array.isArray(sources) || sources.length === 0) {
      throw new Error('SearchAgent returned no sources');
    }

    // Verify citation ID sequence and required properties
    sources.forEach((s, idx) => {
      const expectedCitationId = `S${idx + 1}`;
      if (s.citationId !== expectedCitationId) {
        throw new Error(`Expected citation ${expectedCitationId}, got ${s.citationId}`);
      }
      if (!s.url || !s.title || !s.domain || !s.sourceType) {
        throw new Error(`Source ${s.citationId} missing core fields`);
      }
    });

    const refreshedSession = await ResearchSession.findById(session._id);
    if (refreshedSession.progress < 40) {
      throw new Error(`Expected progress >= 40, got ${refreshedSession.progress}`);
    }
    console.log(`✓ Sourced & saved ${sources.length} unique candidates with citations [${sources[0].citationId}] to [${sources[sources.length - 1].citationId}]`);
    console.log(`✓ Session progress updated to ${refreshedSession.progress}% ("${refreshedSession.currentStep}")`);

    // 3. Test Deduplication Idempotency (prevent duplicate URLs on re-run)
    console.log('[TEST 3] Source deduplication idempotency on repeat search');
    const repeatSources = await searchAgent.run({
      sessionId: session._id,
      researchPlan: session.researchPlan,
    });
    const totalInDb = await Source.countDocuments({ sessionId: session._id });
    if (totalInDb !== sources.length) {
      throw new Error(`Duplicate sources inserted! Expected ${sources.length}, got ${totalInDb}`);
    }
    console.log(`✓ Duplicate URLs cleanly prevented on re-execution (count remained ${totalInDb})`);

    // 4. Test Orchestrator Autonomous Pipeline (Auto-Plan -> Auto-Search)
    console.log('[TEST 4] OrchestratorAgent full auto-pipeline (Plan -> Search)');
    const autoSession = await ResearchSession.create({
      topic: 'Future of Autonomous Electric Vehicles in Urban Transit',
      status: ResearchSessionStatus.CREATED,
    });

    const orchestrator = new OrchestratorAgent({
      aiProvider: new MockAIProvider(),
      searchProvider: new MockSearchProvider(),
    });

    const autoResult = await orchestrator.searchSession(autoSession._id);
    if (!autoResult.session.researchPlan) throw new Error('Orchestrator failed to auto-plan');
    if (!autoResult.sources || autoResult.sources.length === 0) throw new Error('Orchestrator failed to find sources');
    console.log(`✓ Orchestrator auto-planned and retrieved ${autoResult.sources.length} sources`);

    // 5. Test REST API POST /api/research/:sessionId/search
    console.log('[TEST 5] REST API endpoint (POST /api/research/:sessionId/search)');
    const resSearch = await fetch(`${baseUrl}/${autoSession._id}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (resSearch.status !== 200) {
      const errText = await resSearch.text();
      throw new Error(`Expected 200 from /search, got ${resSearch.status}: ${errText}`);
    }

    const searchApiData = await resSearch.json();
    if (searchApiData.sourcesCount < 1) throw new Error('API returned 0 sources');
    console.log(`✓ REST API returned ${searchApiData.sourcesCount} sources with status: ${searchApiData.status}`);

    // Clean up test sessions & sources
    await Promise.all([
      ResearchSession.deleteMany({ _id: { $in: [session._id, autoSession._id] } }),
      Source.deleteMany({ sessionId: { $in: [session._id, autoSession._id] } }),
    ]);

    console.log('\n=============================================');
    console.log('ALL PHASE 6 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Phase 6 test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPhase6Tests();
