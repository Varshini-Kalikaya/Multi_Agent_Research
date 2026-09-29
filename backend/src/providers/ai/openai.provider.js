import axios from 'axios';
import { AIProvider } from './aiProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { retryWithBackoff } from '../../utils/retry.js';
import { AIProviderError, AISchemaValidationError } from '../../utils/errors.js';

export class OpenAIProvider extends AIProvider {
  constructor(config = {}) {
    super('OpenAIProvider');
    this.apiKey = config.apiKey || env.OPENAI_API_KEY;
    this.model = config.model || env.OPENAI_MODEL || 'gpt-4o-mini';
    this.baseURL = config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout
    });
  }

  /**
   * Internal call with retry and error translation
   */
  async _callChatCompletion({ messages, temperature = 0.3, maxTokens = 2500, responseFormat = null }) {
    if (!this.apiKey) {
      throw new AIProviderError(
        'OPENAI_API_KEY is not configured in .env. Please configure it or use mock provider for testing.'
      );
    }

    const payload = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    return await retryWithBackoff(
      async (attempt) => {
        try {
          logger.debug('AI_PROVIDER', `Calling OpenAI model ${this.model} (attempt ${attempt + 1})`);

          const res = await this.client.post(
            '/chat/completions',
            payload,
            {
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
              },
            }
          );

          const choice = res.data?.choices?.[0];
          if (!choice || !choice.message) {
            throw new AIProviderError('No completion choice returned from OpenAI API');
          }

          return choice.message.content;
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            const errorMsg = error.response.data?.error?.message || error.message;

            // Rate limits or transient server errors should retry
            if (status === 429 || status >= 500) {
              throw new AIProviderError(`OpenAI API error (${status}): ${errorMsg}`, error);
            }

            // Auth or bad request errors should not retry
            const err = new AIProviderError(`OpenAI API rejected request (${status}): ${errorMsg}`, error);
            err.isFatal = true;
            throw err;
          }

          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new AIProviderError('OpenAI API request timed out', error);
          }

          throw new AIProviderError(`Network or connection error: ${error.message}`, error);
        }
      },
      {
        maxRetries: 2,
        baseDelayMs: 1500,
        shouldRetry: (err) => !err.isFatal,
        tag: 'OPENAI_API',
      }
    );
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 2500 }) {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    return await this._callChatCompletion({ messages, temperature, maxTokens });
  }

  async generateStructuredOutput({
    systemPrompt,
    userPrompt,
    validator = null,
    temperature = 0.2,
    maxTokens = 3000,
  }) {
    const messages = [];
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: `${systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON matching the requested structure. Do not include markdown code fences or conversational text outside the JSON object.`,
      });
    }
    messages.push({ role: 'user', content: userPrompt });

    let rawText = '';
    let parsed = null;

    // Retry loop for structured output validation
    let validationAttempts = 0;
    const maxValidationAttempts = 2;

    while (validationAttempts < maxValidationAttempts) {
      validationAttempts++;

      rawText = await this._callChatCompletion({
        messages,
        temperature,
        maxTokens,
        responseFormat: { type: 'json_object' },
      });

      try {
        parsed = this.extractJson(rawText);

        if (validator && typeof validator === 'function') {
          const validationResult = validator(parsed);
          if (!validationResult.valid) {
            logger.warn('AI_PROVIDER', `Schema validation failed: ${validationResult.errors.join(', ')}`);
            if (validationAttempts < maxValidationAttempts) {
              // Append correction instruction to user messages for immediate self-correction
              messages.push({ role: 'assistant', content: rawText });
              messages.push({
                role: 'user',
                content: `Your previous response was missing required fields or had invalid values: ${validationResult.errors.join(
                  ', '
                )}. Please correct and output valid JSON.`,
              });
              continue;
            } else {
              throw new AISchemaValidationError(
                `Output failed schema validation after retries: ${validationResult.errors.join(', ')}`,
                rawText
              );
            }
          }
        }

        return parsed;
      } catch (parseError) {
        if (parseError instanceof AISchemaValidationError && validationAttempts >= maxValidationAttempts) {
          throw parseError;
        }
        if (validationAttempts >= maxValidationAttempts) {
          throw new AISchemaValidationError(`Invalid JSON returned: ${parseError.message}`, rawText);
        }
      }
    }

    return parsed;
  }
}
