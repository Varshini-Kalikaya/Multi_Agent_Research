import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, ResearchSession } from '../src/models/index.js';

const runAuthTests = async () => {
  console.log('--- Starting JWT Authentication Flow Tests ---');
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;
  const researchUrl = `http://localhost:${port}/api/research`;

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Dr. Alan Turing';

  try {
    // 1. Validation test on register
    console.log('[TEST 1] Validation error on missing fields in register');
    const resBad = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bademail' }),
    });
    if (resBad.status !== 400) throw new Error(`Expected 400 for bad register, got ${resBad.status}`);
    console.log('✓ Validation correctly rejected invalid registration (400)');

    // 2. Successful Registration
    console.log('[TEST 2] Register new user');
    const resRegister = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    if (resRegister.status !== 201) throw new Error(`Expected 201, got ${resRegister.status}`);
    const regData = await resRegister.json();
    if (!regData.token || !regData.user || regData.user.email !== testEmail) {
      throw new Error(`Invalid register response: ${JSON.stringify(regData)}`);
    }
    const token = regData.token;
    const userId = regData.user.id;
    console.log(`✓ User registered successfully: ${regData.user.name} (${regData.user.email})`);

    // 3. Duplicate email rejection
    console.log('[TEST 3] Duplicate email rejection');
    const resDup = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    if (resDup.status !== 409) throw new Error(`Expected 409 for duplicate email, got ${resDup.status}`);
    console.log('✓ Correctly rejected duplicate email (409)');

    // 4. Login with bad password
    console.log('[TEST 4] Login with incorrect password');
    const resBadLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    if (resBadLogin.status !== 401) throw new Error(`Expected 401 for wrong password, got ${resBadLogin.status}`);
    console.log('✓ Correctly rejected bad credentials (401)');

    // 5. Successful Login
    console.log('[TEST 5] Login with valid credentials');
    const resLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    if (resLogin.status !== 200) throw new Error(`Expected 200, got ${resLogin.status}`);
    const loginData = await resLogin.json();
    if (!loginData.token) throw new Error('Missing token in login response');
    console.log('✓ User logged in successfully and received JWT');

    // 6. Access /me without token
    console.log('[TEST 6] Access protected route without token');
    const resNoToken = await fetch(`${baseUrl}/me`);
    if (resNoToken.status !== 401) throw new Error(`Expected 401 for missing token, got ${resNoToken.status}`);
    console.log('✓ Protected route rejected request without token (401)');

    // 7. Access /me with valid token
    console.log('[TEST 7] Access protected route with Bearer token');
    const resMe = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resMe.status !== 200) throw new Error(`Expected 200, got ${resMe.status}`);
    const meData = await resMe.json();
    if (meData.user.id !== userId || meData.user.email !== testEmail) {
      throw new Error(`Profile data mismatch: ${JSON.stringify(meData)}`);
    }
    console.log(`✓ Retrieved profile via JWT token: ${meData.user.name}`);

    // 8. Research Session created with JWT attaches userId
    console.log('[TEST 8] Create research session as authenticated user');
    const resAuthSession = await fetch(researchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic: 'Quantum Cryptography vs RSA in 2026' }),
    });
    if (resAuthSession.status !== 201) throw new Error(`Expected 201, got ${resAuthSession.status}`);
    const sessionData = await resAuthSession.json();
    const sessionInDb = await ResearchSession.findById(sessionData.sessionId);
    if (!sessionInDb || sessionInDb.userId?.toString() !== userId) {
      throw new Error(`Expected session to have userId ${userId}, got ${sessionInDb?.userId}`);
    }
    console.log(`✓ Session successfully linked to authenticated userId: ${userId}`);

    // 9. Research Session created as guest succeeds with null userId
    console.log('[TEST 9] Create research session as guest user (backward compatibility)');
    const resGuestSession = await fetch(researchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Deep Sea Thermal Vent Ecosystems' }),
    });
    if (resGuestSession.status !== 201) throw new Error(`Expected 201, got ${resGuestSession.status}`);
    const guestData = await resGuestSession.json();
    const guestSessionInDb = await ResearchSession.findById(guestData.sessionId);
    if (guestSessionInDb.userId !== null) {
      throw new Error(`Expected null userId for guest session, got ${guestSessionInDb.userId}`);
    }
    console.log('✓ Guest session successfully created with userId null');

    // Clean up test documents
    await User.findByIdAndDelete(userId);
    await ResearchSession.findByIdAndDelete(sessionData.sessionId);
    await ResearchSession.findByIdAndDelete(guestData.sessionId);
    console.log('✓ Cleaned up test database records');

    console.log('\n=============================================');
    console.log('ALL JWT AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('=============================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Auth test failed:', error);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runAuthTests();
