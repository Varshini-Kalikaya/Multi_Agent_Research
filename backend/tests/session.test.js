import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import {
  ResearchSession,
  ResearchSessionStatus,
  Source,
  SourceStatus,
  SourceType,
  SourceSummary,
  FactCheck,
  ResearchReport,
} from '../src/models/index.js';

const runPhase2Tests = async () => {
  console.log('--- Starting Phase 2 Database & Research Session Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // 1. Test POST /api/research with missing topic
    console.log('[TEST 1] Validation error on missing topic');
    const resBad = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (resBad.status !== 400) throw new Error(`Expected 400 for empty body, got ${resBad.status}`);
    console.log('✓ Validation correctly rejected empty topic (400)');

    // 2. Test POST /api/research with valid topic
    console.log('[TEST 2] Create new research session (POST /api/research)');
    const testTopic = 'What is the impact of AI on the job market in India?';
    const resCreate = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: testTopic }),
    });
    if (resCreate.status !== 201) throw new Error(`Expected 201, got ${resCreate.status}`);
    const createdData = await resCreate.json();
    console.log('Created session response:', createdData);
    if (!createdData.sessionId) throw new Error('Response missing sessionId');
    if (createdData.status !== ResearchSessionStatus.CREATED) throw new Error(`Expected status CREATED, got ${createdData.status}`);
    if (createdData.progress !== 0) throw new Error(`Expected progress 0, got ${createdData.progress}`);
    console.log('✓ Research session created successfully in MongoDB (201)');

    const sessionId = createdData.sessionId;

    // 3. Test GET /api/research/:sessionId
    console.log('[TEST 3] Fetch created session (GET /api/research/:sessionId)');
    const resGet = await fetch(`${baseUrl}/${sessionId}`);
    if (resGet.status !== 200) throw new Error(`Expected 200, got ${resGet.status}`);
    const sessionDoc = await resGet.json();
    if (sessionDoc._id !== sessionId) throw new Error('Session ID mismatch');
    if (sessionDoc.topic !== testTopic) throw new Error('Topic mismatch');
    console.log('✓ Successfully retrieved session from MongoDB');

    // 4. Test GET /api/research (list)
    console.log('[TEST 4] List research sessions (GET /api/research)');
    const resList = await fetch(baseUrl);
    if (resList.status !== 200) throw new Error(`Expected 200, got ${resList.status}`);
    const listData = await resList.json();
    if (!Array.isArray(listData.sessions) || listData.total < 1) throw new Error('Invalid list response');
    console.log(`✓ Retrieved session list (${listData.total} total sessions)`);

    // 5. Test Invalid and Not Found ID formats
    console.log('[TEST 5] Error handling for invalid and nonexistent IDs');
    const resInvalid = await fetch(`${baseUrl}/not-a-valid-id`);
    if (resInvalid.status !== 400) throw new Error(`Expected 400 for invalid ID, got ${resInvalid.status}`);
    const resNotFound = await fetch(`${baseUrl}/507f1f77bcf86cd799439011`);
    if (resNotFound.status !== 404) throw new Error(`Expected 404 for nonexistent ID, got ${resNotFound.status}`);
    console.log('✓ Invalid ID (400) and Not Found (404) handled gracefully');

    // 6. Test Model Persistence for Source, SourceSummary, FactCheck, ResearchReport
    console.log('[TEST 6] Persistence test for Source, SourceSummary, FactCheck, ResearchReport');
    
    // Create Source
    const source = await Source.create({
      sessionId,
      subQuestionId: 'SQ1',
      citationId: 'S1',
      title: 'NASSCOM Report: Impact of AI on Indian Tech Jobs',
      url: 'https://example.com/reports/nasscom-ai-2025',
      domain: 'example.com',
      snippet: 'AI is transforming the workforce in India with 1.5M new tech roles...',
      sourceType: SourceType.RESEARCH,
      status: SourceStatus.DISCOVERED,
    });
    console.log(`✓ Source created: [${source.citationId}] ${source.title}`);

    // Create SourceSummary
    const summary = await SourceSummary.create({
      sessionId,
      sourceId: source._id,
      summary: 'Comprehensive analysis of AI-driven job transformations in India.',
      keyClaims: [
        {
          claim: 'AI creates 1.5 million net new tech roles in India by 2026',
          evidence: 'Survey of 500 Indian IT enterprises',
          importance: 'high',
        }
      ],
      statistics: [
        { value: '1.5M', context: 'new technology roles created' }
      ],
      limitations: ['Focuses primarily on tier-1 IT services sector'],
    });
    console.log(`✓ SourceSummary created for Source ${source._id}`);

    // Create FactCheck
    const factCheck = await FactCheck.create({
      sessionId,
      verifiedClaims: [
        {
          claim: 'AI is driving job creation in data science and cloud computing',
          supportingSources: ['S1'],
          confidence: 'high',
          status: 'verified',
        }
      ],
      disputedClaims: [],
      unsupportedClaims: [],
      contradictions: [
        {
          claimA: 'AI eliminates 20% of BPO jobs immediately',
          sourceA: 'S2',
          claimB: 'BPO headcount grows 5% through AI augmentation',
          sourceB: 'S1',
          explanation: 'Disagreement on the pace of transition in customer support',
          resolution: 'Automation replaces routine tasks while expanding specialized workflows',
        }
      ],
    });
    console.log(`✓ FactCheck created with ${factCheck.contradictions.length} contradiction records`);

    // Create ResearchReport
    const report = await ResearchReport.create({
      sessionId,
      title: 'The Impact of Artificial Intelligence on Employment in India',
      executiveSummary: 'AI adoption is transforming the Indian labor market...',
      citations: [
        {
          citationId: 'S1',
          sourceId: source._id,
          title: source.title,
          url: source.url,
          domain: source.domain,
          sourceType: source.sourceType,
        }
      ],
      limitations: ['Limited historical data on tier-2 cities'],
    });
    console.log(`✓ ResearchReport created with ${report.citations.length} cited sources`);

    // Verify sub-resource endpoints
    const resSources = await fetch(`${baseUrl}/${sessionId}/sources`);
    const sourcesData = await resSources.json();
    if (sourcesData.count !== 1 || sourcesData.sources[0].citationId !== 'S1') {
      throw new Error('Sources endpoint failed');
    }
    console.log('✓ GET /api/research/:sessionId/sources returned collected source');

    const resReport = await fetch(`${baseUrl}/${sessionId}/report`);
    const reportData = await resReport.json();
    if (reportData.title !== report.title) {
      throw new Error('Report endpoint failed');
    }
    console.log('✓ GET /api/research/:sessionId/report returned research report');

    // 7. Test Cascade Delete
    console.log('[TEST 7] Cascade deletion test');
    const resDel = await fetch(`${baseUrl}/${sessionId}`, { method: 'DELETE' });
    if (resDel.status !== 200) throw new Error(`Expected 200 on delete, got ${resDel.status}`);

    const [deletedSession, remainingSources, remainingSummaries, remainingFactChecks, remainingReports] = await Promise.all([
      ResearchSession.findById(sessionId),
      Source.find({ sessionId }),
      SourceSummary.find({ sessionId }),
      FactCheck.find({ sessionId }),
      ResearchReport.find({ sessionId }),
    ]);

    if (deletedSession) throw new Error('Session was not deleted');
    if (remainingSources.length > 0) throw new Error('Sources were not cascaded');
    if (remainingSummaries.length > 0) throw new Error('Summaries were not cascaded');
    if (remainingFactChecks.length > 0) throw new Error('FactCheck was not cascaded');
    if (remainingReports.length > 0) throw new Error('Report was not cascaded');
    console.log('✓ Cascade delete cleanly removed session and all child records');

    console.log('\n=============================================');
    console.log('ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Phase 2 test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPhase2Tests();
