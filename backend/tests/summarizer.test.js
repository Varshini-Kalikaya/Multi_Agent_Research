import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { SourceService } from '../src/services/source.service.js';
import { SummarizerAgent } from '../src/agents/summarizer.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { validateSourceSummary } from '../src/validators/summary.validator.js';
import { ResearchSession, ResearchSessionStatus } from '../src/models/ResearchSession.js';
import { Source, SourceStatus, SourceType } from '../src/models/Source.js';
import { SourceSummary } from '../src/models/SourceSummary.js';

const runPhase7Tests = async () => {
  console.log('--- Starting Phase 7 Source Processing & Summarizer Agent Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // 1. Test Summary Validator
    console.log('[TEST 1] SourceSummary schema validator');
    const validData = {
      summary: 'Objective summary of the report.',
      keyClaims: [
        { claim: 'AI increases developer velocity by 40%', evidence: 'Survey of developers', importance: 'high' },
      ],
      statistics: [{ value: '40%', context: 'productivity increase' }],
      limitations: ['Self-reported survey metrics'],
    };
    const vRes = validateSourceSummary(validData);
    if (!vRes.valid) throw new Error(`Valid summary failed validation: ${vRes.errors.join(', ')}`);
    console.log('✓ Valid summary passed validation');

    const invalidData = { summary: 'Text', keyClaims: [] };
    if (validateSourceSummary(invalidData).valid) throw new Error('Empty keyClaims should have failed');
    console.log('✓ Validator correctly rejected summary with empty claims');

    // 2. Test HTML Content Cleaner
    console.log('[TEST 2] SourceService.cleanHtml noise removal');
    const dirtyHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Article</title><style>.banner{color:red;}</style></head>
        <body>
          <nav><a href="/">Home</a><a href="/login">Login</a></nav>
          <header><h1>Header Navigation</h1></header>
          <main>
            <p>Artificial intelligence is transforming India&apos;s digital economy &amp; technology sector.</p>
            <script>console.log("analytics tracking");</script>
          </main>
          <footer>Copyright 2026. All rights reserved.</footer>
        </body>
      </html>
    `;
    const cleaned = SourceService.cleanHtml(dirtyHtml);
    if (cleaned.includes('console.log') || cleaned.includes('.banner') || cleaned.includes('Home')) {
      throw new Error('cleanHtml failed to strip navigation or scripts');
    }
    if (!cleaned.includes("India's digital economy & technology sector")) {
      throw new Error('cleanHtml failed to preserve article body content');
    }
    console.log('✓ cleanHtml successfully stripped scripts, styling, nav, headers, and decoded entities');

    // 3. Test Inaccessible Page Handling (Never Fabricate Missing Content)
    console.log('[TEST 3] Inaccessible page handling without fabrication');
    const mockAI = new MockAIProvider();
    const summarizer = new SummarizerAgent({ aiProvider: mockAI, concurrencyLimit: 2 });

    const inaccessibleSource = {
      citationId: 'S99',
      title: 'Broken Source Page',
      url: 'http://invalid-nonexistent-domain-xyz.local/dead-link',
      status: SourceStatus.INACCESSIBLE,
      content: '',
      snippet: '',
    };
    const nullSummary = await summarizer.summarizeSingleSource({
      source: inaccessibleSource,
      topic: 'Impact of AI on jobs in India',
    });
    if (nullSummary !== null) {
      throw new Error('Summarizer should NOT fabricate summary for inaccessible content');
    }
    console.log('✓ Summarizer correctly returned null and refused to fabricate for inaccessible source');

    // 4. Test Concurrent Processing & Summarization of 6 Sources
    console.log('[TEST 4] Concurrent processing & summarization of 6 sources');
    const session = await ResearchSession.create({
      topic: 'Impact of AI on employment in India',
      status: ResearchSessionStatus.SEARCHING,
      progress: 40,
    });

    const sourcesData = [
      {
        citationId: 'S1',
        subQuestionId: 'SQ1',
        title: 'NASSCOM AI Skills Outlook 2025',
        url: 'https://nasscom.in/insights/skills-outlook',
        domain: 'nasscom.in',
        sourceType: SourceType.RESEARCH,
        content: 'Indian IT sector is witnessing rapid acceleration in AI agent adoption. Over 4.5 million IT professionals need upskilling, while 1.2 million net new specialized tech roles will be created by 2026 across cloud and AI data engineering.',
        status: SourceStatus.DISCOVERED,
      },
      {
        citationId: 'S2',
        subQuestionId: 'SQ1',
        title: 'Economic Times: India Entry-Level Tech Hiring Trends',
        url: 'https://economictimes.indiatimes.com/jobs/ai-hiring-trends',
        domain: 'economictimes.indiatimes.com',
        sourceType: SourceType.NEWS,
        content: 'Entry-level routine coding and software quality assurance hiring has contracted by 18% in FY25. Conversely, specialized prompt engineering, MLOps, and AI security engineering demand surged by 120%.',
        status: SourceStatus.DISCOVERED,
      },
      {
        citationId: 'S3',
        subQuestionId: 'SQ2',
        title: 'NITI Aayog: National Strategy on AI for Inclusive Growth',
        url: 'https://niti.gov.in/strategy/ai-inclusive-growth',
        domain: 'niti.gov.in',
        sourceType: SourceType.GOVERNMENT,
        content: 'Government programs under IndiaAI Mission focus on Tier-2 and Tier-3 talent enablement. Target includes training 1 million youth in AI foundational skills and deploying sovereign compute infrastructure.',
        status: SourceStatus.DISCOVERED,
      },
      {
        citationId: 'S4',
        subQuestionId: 'SQ2',
        title: 'Brookings: Developing Economies and Service Export Disruption',
        url: 'https://brookings.edu/research/developing-economies-ai',
        domain: 'brookings.edu',
        sourceType: SourceType.RESEARCH,
        content: 'India represents a unique case study in global services exports. Routine business process outsourcing (BPO) faces high vulnerability to generative voice and text agents over the next 3 to 5 years.',
        status: SourceStatus.DISCOVERED,
      },
      {
        citationId: 'S5',
        subQuestionId: 'SQ3',
        title: 'TechSparks Blog: Startups Replacing Junior Devs',
        url: 'https://medium.com/techsparks/ai-developer-tools-2025',
        domain: 'medium.com',
        sourceType: SourceType.BLOG,
        content: 'Founders in Bengaluru report 3x velocity improvement utilizing multi-agent coding workflows, lowering junior full-time software developer headcount by 25% across early-stage ventures.',
        status: SourceStatus.DISCOVERED,
      },
      {
        citationId: 'S6',
        subQuestionId: 'SQ3',
        title: 'Inaccessible External Source',
        url: 'https://dead-server.invalid/timeout-page',
        domain: 'invalid',
        sourceType: SourceType.UNKNOWN,
        content: '',
        snippet: '',
        status: SourceStatus.INACCESSIBLE,
      },
    ];

    const createdSources = await Source.insertMany(
      sourcesData.map((s) => ({ ...s, sessionId: session._id }))
    );

    const runResult = await summarizer.run({
      sessionId: session._id,
      sources: createdSources,
      topic: session.topic,
    });

    if (runResult.summaries.length !== 5) {
      throw new Error(`Expected 5 summaries (5 accessible, 1 inaccessible), got ${runResult.summaries.length}`);
    }

    // Verify database persistence of SourceSummary documents
    const savedSummaries = await SourceSummary.find({ sessionId: session._id });
    if (savedSummaries.length !== 5) {
      throw new Error(`Expected 5 persisted summaries in DB, got ${savedSummaries.length}`);
    }

    const sampleSummary = savedSummaries[0];
    if (!sampleSummary.summary || sampleSummary.keyClaims.length === 0) {
      throw new Error('Persisted summary missing key claims');
    }

    const refreshedSession = await ResearchSession.findById(session._id);
    if (refreshedSession.progress < 60) {
      throw new Error(`Expected progress >= 60, got ${refreshedSession.progress}`);
    }
    console.log(`✓ Concurrently summarized ${runResult.summaries.length} sources (1 properly skipped as inaccessible)`);
    console.log(`✓ Session progress reached ${refreshedSession.progress}% ("${refreshedSession.currentStep}")`);

    // 5. Test REST Endpoint POST /api/research/:sessionId/summarize
    console.log('[TEST 5] REST API endpoint (POST /api/research/:sessionId/summarize)');
    const resSummarize = await fetch(`${baseUrl}/${session._id}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (resSummarize.status !== 200) {
      const errText = await resSummarize.text();
      throw new Error(`Expected 200 from /summarize, got ${resSummarize.status}: ${errText}`);
    }

    const apiData = await resSummarize.json();
    if (apiData.summariesCount !== 5) {
      throw new Error(`API returned unexpected summariesCount: ${apiData.summariesCount}`);
    }
    console.log(`✓ REST API returned ${apiData.summariesCount} summaries with progress: ${apiData.progress}%`);

    // Clean up
    await Promise.all([
      ResearchSession.deleteOne({ _id: session._id }),
      Source.deleteMany({ sessionId: session._id }),
      SourceSummary.deleteMany({ sessionId: session._id }),
    ]);

    console.log('\n=============================================');
    console.log('ALL PHASE 7 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Phase 7 test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runPhase7Tests();
