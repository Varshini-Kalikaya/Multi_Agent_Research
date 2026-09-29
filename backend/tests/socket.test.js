import http from 'http';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initSocket } from '../src/config/socket.js';
import { ProgressService, ResearchEvents } from '../src/services/progress.service.js';
import { OrchestratorAgent } from '../src/agents/orchestrator.agent.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { ResearchSession } from '../src/models/ResearchSession.js';
import { ResearchReport } from '../src/models/ResearchReport.js';

const runPhase12Tests = async () => {
  console.log('--- Starting Phase 12 Real-Time WebSocket Tests ---');
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const socketUrl = `http://localhost:${port}`;

  let client = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Socket Connection & Room Subscription
    // -------------------------------------------------------------
    console.log('[TEST 1] Socket connection and session:join');
    client = ioClient(socketUrl, { transports: ['websocket', 'polling'] });

    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
    });
    console.log('✓ Socket client successfully connected to server');

    const testSessionId = new mongoose.Types.ObjectId().toString();

    const joinPromise = new Promise((resolve) => {
      client.on('session:joined', (data) => {
        resolve(data);
      });
    });

    client.emit('session:join', { sessionId: testSessionId });
    const joinData = await joinPromise;

    if (joinData.sessionId !== testSessionId) {
      throw new Error(`Expected sessionId ${testSessionId}, got ${joinData.sessionId}`);
    }
    console.log('✓ Successfully joined session room and received session:joined ack');

    // -------------------------------------------------------------
    // TEST 2: Dispatched Real-Time Progress Events
    // -------------------------------------------------------------
    console.log('[TEST 2] ProgressService event emission to room');

    const eventReceivedPromise = new Promise((resolve) => {
      client.on(ResearchEvents.SEARCHING, (payload) => {
        resolve(payload);
      });
    });

    ProgressService.notifySearching(testSessionId, {
      query: 'deep learning transformers in medicine',
      progress: 30,
    });

    const payload = await eventReceivedPromise;
    if (payload.sessionId !== testSessionId || payload.progress !== 30 || payload.stage !== 'SEARCHING') {
      throw new Error(`Payload mismatch: ${JSON.stringify(payload)}`);
    }
    console.log(`✓ Received real-time event [${ResearchEvents.SEARCHING}] with correct envelope`);

    // -------------------------------------------------------------
    // TEST 3: Full Autonomous Pipeline Real-Time Event Stream
    // -------------------------------------------------------------
    console.log('[TEST 3] Real-time event streaming during full pipeline execution');
    const session = await ResearchSession.create({
      topic: 'Next Generation AI Agents for Code Generation',
    });

    const capturedEvents = [];
    client.emit('session:join', { sessionId: session._id.toString() });

    // Listen to all pipeline events
    Object.values(ResearchEvents).forEach((evt) => {
      client.on(evt, (data) => {
        if (data.sessionId === session._id.toString()) {
          capturedEvents.push({ event: evt, stage: data.stage, progress: data.progress });
        }
      });
    });

    const orchestrator = new OrchestratorAgent({ aiProvider: new MockAIProvider() });
    const pipelineResult = await orchestrator.executeFullResearchPipeline(session._id);

    if (pipelineResult.session.status !== 'COMPLETED') {
      throw new Error(`Pipeline did not complete: status ${pipelineResult.session.status}`);
    }

    // Wait a brief moment for any pending socket frames to deliver
    await new Promise((r) => setTimeout(r, 200));

    const eventNames = capturedEvents.map((e) => e.event);
    console.log(`Captured ${capturedEvents.length} events:`, eventNames.join(' -> '));

    if (!eventNames.includes(ResearchEvents.STARTED)) {
      throw new Error(`Missing ${ResearchEvents.STARTED} event`);
    }
    if (!eventNames.includes(ResearchEvents.PLANNING)) {
      throw new Error(`Missing ${ResearchEvents.PLANNING} event`);
    }
    if (!eventNames.includes(ResearchEvents.SEARCHING)) {
      throw new Error(`Missing ${ResearchEvents.SEARCHING} event`);
    }
    if (!eventNames.includes(ResearchEvents.SUMMARIZING)) {
      throw new Error(`Missing ${ResearchEvents.SUMMARIZING} event`);
    }
    if (!eventNames.includes(ResearchEvents.FACT_CHECKING)) {
      throw new Error(`Missing ${ResearchEvents.FACT_CHECKING} event`);
    }
    if (!eventNames.includes(ResearchEvents.WRITING)) {
      throw new Error(`Missing ${ResearchEvents.WRITING} event`);
    }
    if (!eventNames.includes(ResearchEvents.VALIDATION)) {
      throw new Error(`Missing ${ResearchEvents.VALIDATION} event`);
    }
    if (!eventNames.includes(ResearchEvents.COMPLETED)) {
      throw new Error(`Missing ${ResearchEvents.COMPLETED} event`);
    }

    console.log('✓ All 8 real-time research events streamed sequentially to client');

    // Clean up
    await ResearchSession.findByIdAndDelete(session._id);
    await ResearchReport.deleteMany({ sessionId: session._id });

    console.log('\n=============================================');
    console.log('ALL PHASE 12 WEBSOCKET TESTS PASSED!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('Phase 12 tests failed:', error);
    process.exit(1);
  } finally {
    if (client) client.disconnect();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

runPhase12Tests();
