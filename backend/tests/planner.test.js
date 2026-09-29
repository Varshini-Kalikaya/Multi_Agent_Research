import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { PlannerAgent } from '../src/agents/planner.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { validateResearchPlan } from '../src/validators/plan.validator.js';
import { ResearchSession, ResearchSessionStatus } from '../src/models/ResearchSession.js';

const runPhase5Tests = async () => {
  console.log('--- Starting Phase 5 Planner / Orchestrator Agent Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // 1. Test Research Plan Validator
    console.log('[TEST 1] Plan Validator edge case handling');
    
    // Valid plan
    const validPlan = {
      researchTopic: 'Test Topic',
      objective: 'Test Objective',
      subQuestions: [
        { id: 'SQ1', question: 'Q1?', searchQueries: ['query 1'], evidenceType: 'statistics' },
        { id: 'SQ2', question: 'Q2?', searchQueries: ['query 2'], evidenceType: 'reports' },
      ],
    };
    const vResult = validateResearchPlan(validPlan);
    if (!vResult.valid) throw new Error(`Valid plan failed validation: ${vResult.errors.join(', ')}`);
    console.log('✓ Valid plan passed validator');

    // Invalid plans
    const noSubQuestions = { researchTopic: 'Topic', objective: 'Obj', subQuestions: [] };
    if (validateResearchPlan(noSubQuestions).valid) throw new Error('Empty subQuestions should fail');

    const missingQueries = {
      researchTopic: 'Topic',
      objective: 'Obj',
      subQuestions: [{ id: 'SQ1', question: 'Q?', searchQueries: [], evidenceType: 'stats' }],
    };
    if (validateResearchPlan(missingQueries).valid) throw new Error('Missing searchQueries should fail');
    console.log('✓ Validator correctly rejected malformed research plans');

    // 2. Test Planner Agent with multiple research topics
    console.log('[TEST 2] PlannerAgent execution across multiple distinct research topics');
    const mockAI = new MockAIProvider();
    const planner = new PlannerAgent({ aiProvider: mockAI });

    const topicsToTest = [
      'What is the impact of artificial intelligence on employment in India?',
      'How will quantum computing affect modern cryptographic protocols and cybersecurity?',
      'What are the macroeconomic risks of global climate change on agricultural supply chains?',
    ];

    for (const [idx, topic] of topicsToTest.entries()) {
      console.log(`  Topic ${idx + 1}: "${topic}"`);
      const plan = await planner.run({ topic });

      if (!plan.researchTopic) throw new Error('Plan missing researchTopic');
      if (!plan.objective) throw new Error('Plan missing objective');
      if (!Array.isArray(plan.subQuestions) || plan.subQuestions.length < 2) {
        throw new Error(`Plan generated insufficient sub-questions (${plan.subQuestions?.length})`);
      }

      // Verify structure of each subQuestion
      plan.subQuestions.forEach((sq) => {
        if (!sq.id.startsWith('SQ')) throw new Error(`Invalid SQ id: ${sq.id}`);
        if (!sq.question) throw new Error(`SQ ${sq.id} missing question`);
        if (!Array.isArray(sq.searchQueries) || sq.searchQueries.length === 0) {
          throw new Error(`SQ ${sq.id} missing searchQueries`);
        }
      });

      console.log(`  ✓ Plan ${idx + 1} generated: ${plan.subQuestions.length} sub-questions, objective: "${plan.objective.slice(0, 70)}..."`);
    }

    // 3. Test Database Persistence in ResearchSession
    console.log('[TEST 3] ResearchSession plan persistence');
    const session = await ResearchSession.create({
      topic: 'Impact of AI on jobs in India',
      status: ResearchSessionStatus.CREATED,
    });

    const persistedPlan = await planner.run({
      topic: session.topic,
      sessionId: session._id,
    });

    const refreshedSession = await ResearchSession.findById(session._id);
    if (!refreshedSession.researchPlan) throw new Error('Session did not persist researchPlan');
    if (refreshedSession.researchPlan.subQuestions.length !== persistedPlan.subQuestions.length) {
      throw new Error('Persisted subQuestions count mismatch');
    }
    if (refreshedSession.progress !== 20) throw new Error(`Expected progress 20, got ${refreshedSession.progress}`);
    console.log(`✓ Research plan persisted in MongoDB with progress=${refreshedSession.progress}%`);

    // 4. Test REST API POST /api/research/:sessionId/plan
    console.log('[TEST 4] Trigger planning via REST API (POST /api/research/:sessionId/plan)');
    const apiSession = await ResearchSession.create({
      topic: 'Autonomous AI Agents in Healthcare Diagnosis',
      status: ResearchSessionStatus.CREATED,
    });

    const resPlan = await fetch(`${baseUrl}/${apiSession._id}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (resPlan.status !== 200) {
      const errText = await resPlan.text();
      throw new Error(`Expected 200 from /plan endpoint, got ${resPlan.status}: ${errText}`);
    }

    const planApiData = await resPlan.json();
    if (!planApiData.researchPlan || !planApiData.researchPlan.subQuestions) {
      throw new Error('API response missing researchPlan or subQuestions');
    }
    console.log('✓ REST API /plan endpoint successfully generated & persisted plan');

    // Clean up test sessions
    await ResearchSession.deleteMany({ _id: { $in: [session._id, apiSession._id] } });

    console.log('\n=============================================');
    console.log('ALL PHASE 5 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Phase 5 test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPhase5Tests();
