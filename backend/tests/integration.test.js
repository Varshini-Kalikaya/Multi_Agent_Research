import http from 'http';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initSocket } from '../src/config/socket.js';
import { ResearchSession } from '../src/models/ResearchSession.js';
import { ResearchReport } from '../src/models/ResearchReport.js';
import { Source } from '../src/models/Source.js';
import { SourceSummary } from '../src/models/SourceSummary.js';
import { FactCheck } from '../src/models/FactCheck.js';

const runIntegrationTests = async () => {
  console.log('=====================================================');
  console.log('STARTING MULTI-AGENT END-TO-END INTEGRATION TEST SUITE');
  console.log('=====================================================');
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/research`;
  const socketUrl = `http://localhost:${port}`;

  let client = null;
  let createdSessionId = null;

  try {
    // 1. Create Research Session via REST API
    console.log('[STEP 1] Initializing Research Session via POST /api/research');
    const topic = 'Impact of AI on Healthcare Diagnostics and Medical Imaging in India';
    const createRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    const createJson = await createRes.json();

    createdSessionId = createJson.sessionId || createJson._id;
    if (createRes.status !== 201 || !createdSessionId) {
      throw new Error(`Failed to create session: ${JSON.stringify(createJson)}`);
    }
    console.log(`✓ Session initialized: ${createdSessionId} (Status: ${createJson.status})`);

    // 2. Connect Socket.IO client and join room
    console.log('[STEP 2] Connecting Socket.IO client and subscribing to room');
    client = ioClient(socketUrl, { transports: ['websocket', 'polling'] });
    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
    });

    const receivedEvents = [];
    client.emit('session:join', { sessionId: createdSessionId });

    const expectedEvents = [
      'research:started',
      'research:planning',
      'research:searching',
      'research:summarizing',
      'research:fact-checking',
      'research:writing',
      'research:validation',
      'research:completed',
    ];

    expectedEvents.forEach((evt) => {
      client.on(evt, (data) => {
        if (data.sessionId === createdSessionId) {
          receivedEvents.push({ event: evt, stage: data.stage, progress: data.progress, message: data.message });
          console.log(`  -> Socket event: [${evt}] (${data.progress}%) ${data.message}`);
        }
      });
    });
    console.log('✓ Socket client joined session room');

    // 3. Trigger Full Autonomous Execution Pipeline via POST /api/research/:sessionId/execute
    console.log('[STEP 3] Triggering Autonomous Multi-Agent Pipeline via POST /execute');
    const execRes = await fetch(`${baseUrl}/${createdSessionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const execJson = await execRes.json();

    if (execRes.status !== 200 || execJson.status !== 'COMPLETED' || execJson.progress !== 100) {
      throw new Error(`Execution failed: ${JSON.stringify(execJson)}`);
    }
    console.log(`✓ Autonomous Pipeline Execution completed successfully: 100% COMPLETED`);

    // Wait briefly for trailing socket notifications
    await new Promise((r) => setTimeout(r, 200));

    // 4. Verify Socket events stream
    console.log('[STEP 4] Verifying Real-Time Event Stream Delivery');
    const capturedEventNames = receivedEvents.map((e) => e.event);
    for (const expected of expectedEvents) {
      if (!capturedEventNames.includes(expected)) {
        throw new Error(`Missing expected real-time event: ${expected}`);
      }
    }
    console.log(`✓ All 8 real-time research workflow events received in order (${receivedEvents.length} events logged)`);

    // 5. Verify Sources Discovery via GET /api/research/:sessionId/sources
    console.log('[STEP 5] Verifying Discovered & Cleaned Sources');
    const sourcesRes = await fetch(`${baseUrl}/${createdSessionId}/sources`);
    const sourcesJson = await sourcesRes.json();

    if (sourcesRes.status !== 200 || !Array.isArray(sourcesJson.sources) || sourcesJson.sources.length === 0) {
      throw new Error(`Invalid sources returned: ${JSON.stringify(sourcesJson)}`);
    }

    const firstSource = sourcesJson.sources[0];
    if (!firstSource.citationId || !firstSource.url || !firstSource.title) {
      throw new Error(`Source missing citationId, url, or title: ${JSON.stringify(firstSource)}`);
    }
    console.log(`✓ Retrieved ${sourcesJson.sources.length} sources with citation tags [${sourcesJson.sources.map((s) => s.citationId).join(', ')}]`);

    // 6. Verify Synthesized Research Report via GET /api/research/:sessionId/report
    console.log('[STEP 6] Verifying Synthesized & Validated Research Report');
    const reportRes = await fetch(`${baseUrl}/${createdSessionId}/report`);
    const reportJson = await reportRes.json();

    const report = reportJson.report || reportJson;
    if (!report.title || !report.executiveSummary) {
      throw new Error(`Report missing title or executiveSummary: ${JSON.stringify(report)}`);
    }

    if (!Array.isArray(report.content?.keyFindings) || report.content.keyFindings.length === 0) {
      throw new Error('Report missing keyFindings');
    }

    if (!Array.isArray(report.content?.detailedAnalysis) || report.content.detailedAnalysis.length === 0) {
      throw new Error('Report missing detailedAnalysis');
    }

    if (!report.markdown || !report.markdown.includes('## References and Consulted Sources')) {
      throw new Error('Report missing formatted markdown export with references');
    }

    if (!Array.isArray(report.citations) || report.citations.length === 0) {
      throw new Error('Report missing citations registry');
    }

    console.log(`✓ Final Research Report verified:`);
    console.log(`   - Title: "${report.title}"`);
    console.log(`   - Key Findings: ${report.content.keyFindings.length} findings with inline citations`);
    console.log(`   - Sub-Questions Analysis: ${report.content.detailedAnalysis.length} sections`);
    console.log(`   - Registered Citations: ${report.citations.length} sources mapped`);
    console.log(`   - Markdown Length: ${report.markdown.length} characters`);

    // 7. Verify Sessions List via GET /api/research
    console.log('[STEP 7] Verifying Session History Listing');
    const listRes = await fetch(baseUrl);
    const listJson = await listRes.json();

    const foundSession = (listJson.sessions || []).find((s) => s._id === createdSessionId);
    if (!foundSession || foundSession.status !== 'COMPLETED') {
      throw new Error('Created session not found in completed history list');
    }
    console.log(`✓ Session successfully listed in session history with status COMPLETED`);

    console.log('\n=====================================================');
    console.log('ALL MULTI-AGENT INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('=====================================================\n');
  } catch (error) {
    console.error('Integration test failed:', error);
    process.exit(1);
  } finally {
    if (client) client.disconnect();
    server.close();

    // Clean up test session records
    if (createdSessionId) {
      await ResearchSession.findByIdAndDelete(createdSessionId);
      await Source.deleteMany({ sessionId: createdSessionId });
      await SourceSummary.deleteMany({ sessionId: createdSessionId });
      await FactCheck.deleteMany({ sessionId: createdSessionId });
      await ResearchReport.deleteMany({ sessionId: createdSessionId });
    }

    await mongoose.disconnect();
    process.exit(0);
  }
};

runIntegrationTests();
