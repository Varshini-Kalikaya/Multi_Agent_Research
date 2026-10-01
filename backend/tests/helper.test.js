process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

console.log('--- Starting Helper AI Assistant API Tests ---');

async function runHelperTests() {
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const helperUrl = `http://localhost:${port}/api/helper/chat`;

  try {
    console.log('[TEST 1] Validation: Empty message should return 400 Bad Request');
    const resEmpty = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });
    const dataEmpty = await resEmpty.json();
    assert.strictEqual(resEmpty.status, 400, 'Expected 400 status for empty message');
    assert.strictEqual(dataEmpty.success, false, 'Expected success: false');
    console.log('✓ Rejected empty input with 400 Validation Error');

    console.log('[TEST 2] Basic Question: What is artificial intelligence?');
    const resBasic = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is artificial intelligence?' }),
    });
    const dataBasic = await resBasic.json();
    assert.strictEqual(resBasic.status, 200, 'Expected 200 OK');
    assert.strictEqual(dataBasic.success, true, 'Expected success: true');
    assert(dataBasic.message.includes('Artificial Intelligence') || dataBasic.message.includes('AI'), 'Expected AI definition');
    console.log('✓ Successfully answered basic AI concept question');

    console.log('[TEST 3] Follow-up Question: What are its advantages? (with conversation history)');
    const resFollowUp = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are its advantages?',
        history: [
          { role: 'user', content: 'What is artificial intelligence?' },
          { role: 'assistant', content: 'Artificial Intelligence (AI) is a branch of computer science...' },
        ],
      }),
    });
    const dataFollowUp = await resFollowUp.json();
    assert.strictEqual(resFollowUp.status, 200, 'Expected 200 OK');
    assert.strictEqual(dataFollowUp.success, true, 'Expected success: true');
    assert(dataFollowUp.message.toLowerCase().includes('advantages') || dataFollowUp.message.toLowerCase().includes('efficiency'), 'Expected contextual follow-up advantages');
    console.log('✓ Successfully handled contextual follow-up question');

    console.log('[TEST 4] Technical Question: Explain REST API with a simple example');
    const resTechnical = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explain REST API with a simple example' }),
    });
    const dataTechnical = await resTechnical.json();
    assert.strictEqual(resTechnical.status, 200, 'Expected 200 OK');
    assert(dataTechnical.message.includes('REST') && dataTechnical.message.includes('HTTP'), 'Expected REST API explanation');
    console.log('✓ Successfully answered technical REST API question');

    console.log('[TEST 5] Coding Question: Write a Python program to find duplicate elements in an array');
    const resCoding = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Write a Python program to find duplicate elements in an array' }),
    });
    const dataCoding = await resCoding.json();
    assert.strictEqual(resCoding.status, 200, 'Expected 200 OK');
    assert(dataCoding.message.includes('```python'), 'Expected python code block');
    assert(dataCoding.message.includes('find_duplicates') || dataCoding.message.includes('set()'), 'Expected runnable code');
    console.log('✓ Successfully returned formatted Python code block');

    console.log('[TEST 6] Application Question: How does the research pipeline work?');
    const resApp = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How does the research pipeline work?' }),
    });
    const dataApp = await resApp.json();
    assert.strictEqual(resApp.status, 200, 'Expected 200 OK');
    assert(dataApp.message.includes('Planner') && dataApp.message.includes('Fact-Checker'), 'Expected explanation of research agents');
    console.log('✓ Successfully explained the application multi-agent architecture');

    console.log('[TEST 7] Research Request Question: Research the impact of AI on jobs in India');
    const resResearch = await fetch(helperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Research the impact of AI on jobs in India' }),
    });
    const dataResearch = await resResearch.json();
    assert.strictEqual(resResearch.status, 200, 'Expected 200 OK');
    assert.strictEqual(dataResearch.isResearchTopic, true, 'Expected isResearchTopic: true');
    assert(dataResearch.suggestedTopic !== null, 'Expected suggestedTopic extracted');
    console.log(`✓ Detected research intent and extracted suggested topic: "${dataResearch.suggestedTopic}"`);

    console.log('\n=============================================');
    console.log('ALL HELPER AI ASSISTANT BACKEND TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('Helper test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    await disconnectDB();
  }
}

runHelperTests();
