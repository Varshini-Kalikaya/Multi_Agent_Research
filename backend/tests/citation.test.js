import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { CitationService } from '../src/services/citation.service.js';
import { extractCitationsFromText, extractAllReportCitations, validateCitations } from '../src/validators/citation.validator.js';
import { OrchestratorAgent } from '../src/agents/orchestrator.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { ResearchSession, ResearchSessionStatus } from '../src/models/ResearchSession.js';
import { ResearchReport } from '../src/models/ResearchReport.js';
import { Source } from '../src/models/Source.js';

const runPhase11Tests = async () => {
  console.log('--- Starting Phase 11 Citation Validator Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Citation Extraction Regex Utilities
    // -------------------------------------------------------------
    console.log('[TEST 1] Citation Extraction Utilities');
    const textWithCitations = 'Routine jobs are impacted [S1], but new roles emerge rapidly [S2, S3]. Inconclusive data [s4].';
    const extracted = extractCitationsFromText(textWithCitations);

    if (extracted.length !== 4 || !extracted.includes('S1') || !extracted.includes('S2') || !extracted.includes('S3') || !extracted.includes('S4')) {
      throw new Error(`Expected 4 extracted citations, got: ${JSON.stringify(extracted)}`);
    }
    console.log('✓ Successfully extracted and normalized single, multi, and lowercase citation tags');

    // -------------------------------------------------------------
    // TEST 2: Validate Against Genuine Source Registry
    // -------------------------------------------------------------
    console.log('[TEST 2] Citation Validation against Genuine Sources');
    const genuineSources = [
      { citationId: 'S1', title: 'Source 1' },
      { citationId: 'S2', title: 'Source 2' },
      { citationId: 'S3', title: 'Source 3' },
    ];

    const cleanReport = {
      title: 'Valid Report',
      executiveSummary: 'AI automation is sweeping industry [S1]. Specialized hiring accelerates [S2].',
      keyFindings: [{ explanation: 'Findings cited [S1, S3]', citations: ['S1', 'S3'] }],
    };

    const cleanValidation = validateCitations({ report: cleanReport, sources: genuineSources });
    if (!cleanValidation.valid || cleanValidation.invalidCitations.length > 0) {
      throw new Error(`Expected clean report to be valid, got errors: ${cleanValidation.errors.join(', ')}`);
    }
    console.log('✓ Genuine citations properly validated with zero errors');

    // Flagged Hallucinated Citations
    const hallucinatedReport = {
      title: 'Report with Hallucination',
      executiveSummary: 'Unverified claim referencing non-existent source [S99].',
      keyFindings: [{ explanation: 'Another phantom tag [S42]', citations: ['S42'] }],
    };

    const hallucinatedValidation = validateCitations({ report: hallucinatedReport, sources: genuineSources });
    if (hallucinatedValidation.valid || hallucinatedValidation.invalidCitations.length !== 2) {
      throw new Error(`Expected 2 invalid citations flagged, got: ${JSON.stringify(hallucinatedValidation.invalidCitations)}`);
    }
    console.log('✓ Successfully identified hallucinated/non-existent citations [S99, S42]');

    // -------------------------------------------------------------
    // TEST 3: Autonomous Citation Correction
    // -------------------------------------------------------------
    console.log('[TEST 3] Autonomous Citation Correction');
    const correctionResult = CitationService.validateAndCorrect({
      report: hallucinatedReport,
      sources: genuineSources,
    });

    if (!correctionResult.wasCorrected) {
      throw new Error('Expected report to be marked wasCorrected=true');
    }
    if (!correctionResult.validation.valid) {
      throw new Error('Re-validation of corrected report failed');
    }
    if (correctionResult.report.executiveSummary.includes('[S99]')) {
      throw new Error('Hallucinated tag [S99] was not sanitized from executiveSummary');
    }
    console.log('✓ Autonomous correction sanitized invalid citations and passed re-validation');

    // -------------------------------------------------------------
    // TEST 4: Orchestrator Citation Validation Pipeline & Session Completion
    // -------------------------------------------------------------
    console.log('[TEST 4] Orchestrator Citation Validation & Pipeline Completion');
    const session = await ResearchSession.create({
      topic: 'GenAI Impact on Graphic Design and Creative Work',
    });

    const orchestrator = new OrchestratorAgent({ aiProvider: new MockAIProvider() });
    const fullResult = await orchestrator.validateCitationsSession(session._id);

    if (fullResult.session.status !== ResearchSessionStatus.COMPLETED) {
      throw new Error(`Expected session status COMPLETED, got ${fullResult.session.status}`);
    }
    if (fullResult.session.progress !== 100) {
      throw new Error(`Expected session progress 100%, got ${fullResult.session.progress}%`);
    }
    if (!fullResult.report) {
      throw new Error('Report missing from validation result');
    }
    console.log('✓ Autonomous orchestrator reached 100% COMPLETED status with validated report');

    // -------------------------------------------------------------
    // TEST 5: REST API Endpoints (/validate-citations & /execute)
    // -------------------------------------------------------------
    console.log('[TEST 5] REST API Citation Validation & Full Pipeline Endpoints');

    // Test POST /:sessionId/validate-citations
    const valRes = await fetch(`${baseUrl}/${session._id}/validate-citations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const valJson = await valRes.json();
    if (valRes.status !== 200 || valJson.status !== 'COMPLETED') {
      throw new Error(`POST /validate-citations failed: status ${valRes.status}`);
    }
    console.log('✓ POST /api/research/:sessionId/validate-citations completed with status COMPLETED');

    // Test POST /:sessionId/execute on a new session
    const fullSession = await ResearchSession.create({
      topic: 'Autonomous Electric Aviation and Battery Weight Limits',
    });

    const execRes = await fetch(`${baseUrl}/${fullSession._id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const execJson = await execRes.json();
    if (execRes.status !== 200 || execJson.status !== 'COMPLETED' || execJson.progress !== 100) {
      throw new Error(`POST /execute failed: status ${execRes.status}`);
    }
    console.log(`✓ POST /api/research/:sessionId/execute completed full pipeline: 100% COMPLETED`);

    // Clean up
    await ResearchSession.findByIdAndDelete(session._id);
    await ResearchSession.findByIdAndDelete(fullSession._id);
    await ResearchReport.deleteMany({ sessionId: { $in: [session._id, fullSession._id] } });

    console.log('\n=============================================');
    console.log('ALL PHASE 11 CITATION VALIDATOR TESTS PASSED!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('Phase 11 tests failed:', error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runPhase11Tests();
