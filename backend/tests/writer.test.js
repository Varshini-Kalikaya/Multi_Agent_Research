import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { WriterAgent } from '../src/agents/writer.agent.js';
import { OrchestratorAgent } from '../src/agents/orchestrator.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { validateResearchReport } from '../src/validators/report.validator.js';
import { ResearchSession } from '../src/models/ResearchSession.js';
import { ResearchReport } from '../src/models/ResearchReport.js';

const runPhase10Tests = async () => {
  console.log('--- Starting Phase 10 Writer Agent Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Schema Validator
    // -------------------------------------------------------------
    console.log('[TEST 1] Report schema validator');
    const validData = {
      title: 'Valid Research Report Title',
      executiveSummary: 'This is an executive summary that is sufficiently long and rigorous to pass schema criteria without errors.',
      keyFindings: [
        { title: 'Finding 1', explanation: 'Explanation with citation [S1]', citations: ['S1'] },
      ],
      detailedAnalysis: [
        { subQuestionId: 'SQ1', question: 'Sub-question 1?', analysis: 'Analysis with [S1]', citations: ['S1'] },
      ],
      statistics: [{ metric: 'Metric 1', value: '100%', context: 'sample context', sourceCitation: '[S1]' }],
      contradictions: [],
      limitations: ['Sample limitation 1'],
      conclusion: 'Final objective conclusion with [S1].',
      markdown: '# Full Markdown Report\n\nDetailed narrative with citations [S1].',
    };

    const validResult = validateResearchReport(validData);
    if (!validResult.valid) {
      throw new Error(`Expected valid report to pass, got: ${validResult.errors.join(', ')}`);
    }
    console.log('✓ Valid report passed schema validation');

    const invalidResult = validateResearchReport({ title: 'Short' });
    if (invalidResult.valid) {
      throw new Error('Expected invalid report to fail validation');
    }
    console.log('✓ Validator correctly caught missing fields');

    // -------------------------------------------------------------
    // TEST 2: WriterAgent with In-Memory Evidence Package
    // -------------------------------------------------------------
    console.log('[TEST 2] WriterAgent Synthesis with In-Memory Evidence');
    const mockEvidence = {
      researchTopic: 'AI Impact on Medical Diagnostics',
      objective: 'Evaluate diagnostic accuracy and clinical adoption of AI models.',
      sources: [
        {
          citationId: 'S1',
          tag: '[S1]',
          title: 'Lancet Digital Health AI Review',
          url: 'https://thelancet.com/ai-diagnostics',
          domain: 'thelancet.com',
          sourceType: 'research',
        },
        {
          citationId: 'S2',
          tag: '[S2]',
          title: 'FDA AI Medical Device Approvals',
          url: 'https://fda.gov/medical-devices/ai',
          domain: 'fda.gov',
          sourceType: 'government',
        },
      ],
      subQuestions: [
        {
          id: 'SQ1',
          question: 'How accurate are modern vision models in radiology?',
          evidenceType: 'metrics',
          sources: [],
          claims: [{ claim: 'AI matches expert radiologists in melanoma detection', evidence: 'Trial of 1000 scans', importance: 'high', sourceTag: '[S1]' }],
          statistics: [{ value: '94.5%', context: 'sensitivity rate', sourceTag: '[S1]' }],
        },
      ],
      summaries: [],
      factCheck: {
        verifiedClaims: [{ claim: 'Radiology vision models match expert sensitivity', supportingSources: ['S1'], confidence: 'high' }],
        disputedClaims: [],
        unsupportedClaims: [],
        contradictions: [],
      },
      allStatistics: [{ value: '94.5%', context: 'sensitivity rate', sourceTag: '[S1]' }],
      allLimitations: ['Data predominantly based on retrospective cohort studies.'],
    };

    const writerAgent = new WriterAgent({ aiProvider: new MockAIProvider() });
    const writeResult = await writerAgent.run({ evidencePackage: mockEvidence });

    if (!writeResult.generated.title || !writeResult.generated.executiveSummary) {
      throw new Error('WriterAgent failed to synthesize title and executive summary');
    }
    if (!writeResult.report.citations || writeResult.report.citations.length !== 2) {
      throw new Error(`Expected 2 citation registry entries, got ${writeResult.report.citations?.length}`);
    }
    if (!writeResult.report.markdown.includes('## References and Consulted Sources') && !writeResult.report.markdown.includes('[S1]')) {
      throw new Error('Markdown report missing reference appendix or citation tags');
    }
    console.log('✓ WriterAgent successfully generated structured report with citations and markdown');

    // -------------------------------------------------------------
    // TEST 3: Autonomous Orchestrator End-to-End Pipeline to Report
    // -------------------------------------------------------------
    console.log('[TEST 3] Autonomous Orchestration (Plan -> Search -> Summarize -> FactCheck -> Write)');
    const session = await ResearchSession.create({
      topic: 'Future of Quantum Computing in Cryptography',
    });

    const orchestrator = new OrchestratorAgent({ aiProvider: new MockAIProvider() });
    const reportResult = await orchestrator.writeReportSession(session._id);

    if (!reportResult.report) {
      throw new Error('Orchestrator did not return a generated report');
    }
    if (reportResult.session.progress < 85) {
      throw new Error(`Expected session progress >= 85%, got ${reportResult.session.progress}%`);
    }

    const savedReport = await ResearchReport.findOne({ sessionId: session._id });
    if (!savedReport) {
      throw new Error('Report document not found in MongoDB');
    }
    console.log(`✓ Autonomous pipeline synthesized and saved report: "${savedReport.title}"`);

    // -------------------------------------------------------------
    // TEST 4: REST API Endpoints (POST /:sessionId/write & GET /:sessionId/report)
    // -------------------------------------------------------------
    console.log('[TEST 4] REST API Report Endpoints');

    // Fetch report via GET
    const getRes = await fetch(`${baseUrl}/${session._id}/report`);
    const getJson = await getRes.json();
    const fetchedReport = getJson.report || getJson;
    if (getRes.status !== 200 || !fetchedReport?.title) {
      throw new Error(`GET /report failed: status ${getRes.status}`);
    }
    console.log('✓ GET /api/research/:sessionId/report returned valid report document');

    // Trigger write endpoint on fresh session
    const freshSession = await ResearchSession.create({
      topic: 'Solid-State Battery Breakthroughs in EV Industry',
    });

    const writeRes = await fetch(`${baseUrl}/${freshSession._id}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const writeJson = await writeRes.json();
    if (writeRes.status !== 200 || !writeJson.report) {
      throw new Error(`POST /write failed: status ${writeRes.status}`);
    }
    console.log(`✓ POST /api/research/:sessionId/write completed successfully, progress: ${writeJson.progress}%`);

    // Clean up
    await ResearchSession.findByIdAndDelete(session._id);
    await ResearchSession.findByIdAndDelete(freshSession._id);
    await ResearchReport.deleteMany({ sessionId: { $in: [session._id, freshSession._id] } });

    console.log('\n=============================================');
    console.log('ALL PHASE 10 WRITER AGENT TESTS PASSED!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('Phase 10 tests failed:', error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runPhase10Tests();
