import { AIProvider, getAIProvider } from '../src/providers/ai/aiProvider.js';
import { OpenAIProvider } from '../src/providers/ai/openai.provider.js';
import { MockAIProvider } from '../src/providers/ai/mock.provider.js';
import { AIProviderError, AISchemaValidationError } from '../src/utils/errors.js';
import { PLANNER_SYSTEM_PROMPT, buildPlannerUserPrompt } from '../src/prompts/planner.prompt.js';

const runPhase3Tests = async () => {
  console.log('--- Starting Phase 3 AI Provider Abstraction Tests ---');

  try {
    // 1. Test Abstract Class Enforcement
    console.log('[TEST 1] AIProvider abstract class contract enforcement');
    try {
      new AIProvider();
      throw new Error('AIProvider direct instantiation should have failed');
    } catch (err) {
      if (err.message.includes('abstract class')) {
        console.log('✓ Abstract class cannot be instantiated directly');
      } else {
        throw err;
      }
    }

    // 2. Test JSON Extraction & Resilience
    console.log('[TEST 2] extractJson utility with markdown fences and noise');
    const mock = new MockAIProvider();

    // Standard JSON
    const standard = mock.extractJson('{"hello": "world"}');
    if (standard.hello !== 'world') throw new Error('Failed to parse standard JSON');

    // Markdown fenced JSON
    const fenced = mock.extractJson('Here is your plan:\n```json\n{"status": "ok", "items": [1, 2, 3]}\n```\nHope that helps!');
    if (fenced.status !== 'ok' || fenced.items.length !== 3) throw new Error('Failed to extract markdown fenced JSON');

    // Invalid JSON throws AISchemaValidationError
    try {
      mock.extractJson('This is definitely not JSON at all.');
      throw new Error('Should have thrown on invalid JSON');
    } catch (err) {
      if (err instanceof AISchemaValidationError) {
        console.log('✓ extractJson correctly rejected non-JSON with AISchemaValidationError');
      } else {
        throw err;
      }
    }

    // 3. Test MockAIProvider Structured Output & Validation
    console.log('[TEST 3] MockAIProvider structured output with schema validator');
    const userPrompt = buildPlannerUserPrompt('What is the impact of AI on employment in India?');
    
    const validator = (data) => {
      const errors = [];
      if (!data.subQuestions || !Array.isArray(data.subQuestions)) errors.push('Missing subQuestions array');
      if (!data.objective) errors.push('Missing objective');
      return { valid: errors.length === 0, errors };
    };

    const structuredResult = await mock.generateStructuredOutput({
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      userPrompt,
      validator,
    });

    if (!structuredResult.subQuestions || structuredResult.subQuestions.length < 1) {
      throw new Error('Mock structured output missing subQuestions');
    }
    console.log('✓ MockAIProvider generated valid structured output matching Planner schema:', {
      objective: structuredResult.objective,
      subQuestionsCount: structuredResult.subQuestions.length,
      sampleSQ: structuredResult.subQuestions[0].question,
    });

    // 4. Test OpenAI Provider Configuration & Error Handling
    console.log('[TEST 4] OpenAIProvider error handling when unconfigured');
    const unconfiguredOpenAI = new OpenAIProvider({ apiKey: '' });
    try {
      await unconfiguredOpenAI.generateText({ userPrompt: 'Hello' });
      throw new Error('Expected unconfigured provider to throw');
    } catch (err) {
      if (err instanceof AIProviderError && err.message.includes('OPENAI_API_KEY')) {
        console.log('✓ Unconfigured OpenAIProvider throws clean, actionable AIProviderError');
      } else {
        throw err;
      }
    }

    // 5. If live API key is present in environment, test real LLM call
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.log('[TEST 5] Testing live OpenAI API call with configured OPENAI_API_KEY');
      const liveOpenAI = new OpenAIProvider();
      const text = await liveOpenAI.generateText({
        systemPrompt: 'You are a test assistant.',
        userPrompt: 'Reply with the word "pong".',
        maxTokens: 10,
      });
      console.log(`✓ Live OpenAI call succeeded. Response: "${text.trim()}"`);
    } else {
      console.log('[TEST 5] Live API key not set in environment - verified error handling and mock flow');
    }

    // 6. Test Provider Factory
    console.log('[TEST 6] getAIProvider() factory instantiation');
    const provider = await getAIProvider();
    if (!provider || typeof provider.generateStructuredOutput !== 'function') {
      throw new Error('getAIProvider() did not return a valid provider instance');
    }
    console.log(`✓ Factory successfully resolved AI Provider: ${provider.name}`);

    console.log('\n=============================================');
    console.log('ALL PHASE 3 TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Phase 3 test failed:', error);
    process.exit(1);
  }
};

runPhase3Tests();
