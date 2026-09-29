import { AIProviderError, AISchemaValidationError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

/**
 * Base AI Provider Abstract Class
 * Defines the contract that all concrete AI providers must implement
 */
export class AIProvider {
  constructor(name = 'BaseAIProvider') {
    if (this.constructor === AIProvider) {
      throw new Error('AIProvider is an abstract class and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Generate raw text response from LLM
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {number} [params.temperature]
   * @param {number} [params.maxTokens]
   * @returns {Promise<string>}
   */
  async generateText({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 2500 }) {
    throw new Error('generateText() must be implemented by subclass');
  }

  /**
   * Generate structured JSON output validated against expected structure
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {Function} [params.validator] - Optional validation function returning { valid, errors }
   * @param {number} [params.temperature]
   * @param {number} [params.maxTokens]
   * @returns {Promise<Object>} Parsed and validated JSON object
   */
  async generateStructuredOutput({
    systemPrompt,
    userPrompt,
    validator = null,
    temperature = 0.2,
    maxTokens = 3000,
  }) {
    throw new Error('generateStructuredOutput() must be implemented by subclass');
  }

  /**
   * Robust JSON extraction utility from LLM responses (strips markdown fences and extraneous text)
   * @param {string} text
   * @returns {Object}
   */
  extractJson(text) {
    if (!text || typeof text !== 'string') {
      throw new AISchemaValidationError('Empty response received from LLM', text);
    }

    let cleaned = text.trim();

    // 1. Remove markdown code blocks if wrapped in ```json ... ``` or ``` ... ```
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    // 2. Locate first '{' or '[' and matching closing character
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('AI_PROVIDER', `Failed to parse JSON from LLM: ${parseError.message}`);
      throw new AISchemaValidationError(`Invalid JSON returned by LLM: ${parseError.message}`, text);
    }
  }
}

/**
 * Factory to get active AI Provider instance based on configuration
 */
let cachedProvider = null;

export const getAIProvider = async (overrideType = null, forceNew = false) => {
  if (cachedProvider && !overrideType && !forceNew) return cachedProvider;

  const providerType = (overrideType || env.AI_PROVIDER || 'openai').toLowerCase();
  let provider = null;

  switch (providerType) {
    case 'openai': {
      if (!env.OPENAI_API_KEY && !overrideType) {
        logger.warn(
          'AI_PROVIDER',
          'OPENAI_API_KEY is not configured in .env. Falling back to MockAIProvider for offline/test execution.'
        );
        const { MockAIProvider } = await import('./mock.provider.js');
        provider = new MockAIProvider();
      } else {
        const { OpenAIProvider } = await import('./openai.provider.js');
        provider = new OpenAIProvider();
      }
      break;
    }
    case 'mock': {
      const { MockAIProvider } = await import('./mock.provider.js');
      provider = new MockAIProvider();
      break;
    }
    default: {
      logger.warn('AI_PROVIDER', `Unknown AI_PROVIDER "${providerType}", falling back to MockAIProvider`);
      const { MockAIProvider } = await import('./mock.provider.js');
      provider = new MockAIProvider();
      break;
    }
  }

  logger.info('AI_PROVIDER', `Initialized AI Provider: ${provider.name}`);
  if (!overrideType) {
    cachedProvider = provider;
  }
  return provider;
};
