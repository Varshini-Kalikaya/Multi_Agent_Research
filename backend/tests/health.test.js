import http from 'http';
import app from '../src/app.js';

const testHealthEndpoint = async () => {
  return new Promise((resolve, reject) => {
    // Start temporary server for isolated test
    const server = http.createServer(app);
    server.listen(0, async () => {
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}/api/health`);
        const data = await res.json();

        console.log(`[TEST] Status code: ${res.status}`);
        console.log(`[TEST] Response body:`, data);

        if (res.status === 200 && data.status === 'ok') {
          console.log('[TEST] PASS: Health check endpoint working as expected.');
          server.close(() => resolve());
        } else {
          server.close(() => reject(new Error(`Test failed: Expected status: 'ok', got ${JSON.stringify(data)}`)));
        }
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
};

testHealthEndpoint()
  .then(() => {
    console.log('[TEST] All Phase 1 backend tests passed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[TEST] Test failed with error:', err);
    process.exit(1);
  });
