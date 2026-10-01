import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { HELPER_SYSTEM_PROMPT } from './helperPrompt.js';
import { generateContextualResponse } from './helperKnowledge.js';

export class HelperService {
  /**
   * Detect if a user message is an empirical research request
   * suited for the multi-agent research pipeline.
   * @param {string} text 
   * @returns {{ isResearchTopic: boolean, suggestedTopic: string|null }}
   */
  static detectResearchIntent(text) {
    if (!text || typeof text !== 'string') {
      return { isResearchTopic: false, suggestedTopic: null };
    }

    const trimmed = text.trim();

    // Direct research inquiry keywords
    const researchPatterns = [
      /^(?:can you\s+)?(?:please\s+)?(?:research|investigate|study|explore|analyze)\s+(?:the\s+)?(.+)/i,
      /^(?:what is the impact of|how does|what are the effects of)\s+(.+)/i,
      /^(?:deep\s+)?research\s+(?:on|about|into)\s+(.+)/i,
      /impact of .+ (?:on|in) .+/i,
      /breakthroughs? in .+/i,
      /clinical trials? in .+/i,
      /trends? in .+/i,
    ];

    for (const pattern of researchPatterns) {
      const match = trimmed.match(pattern);
      if (match && trimmed.length > 20) {
        let topicCandidate = match[1] ? match[1].trim() : trimmed;
        // Clean trailing punctuation
        topicCandidate = topicCandidate.replace(/[?.!]+$/, '').trim();
        if (topicCandidate.length > 10) {
          return {
            isResearchTopic: true,
            suggestedTopic: trimmed.replace(/[?.!]+$/, '').trim(),
          };
        }
      }
    }

    return { isResearchTopic: false, suggestedTopic: null };
  }

  /**
   * Sanitize and bound conversation history to prevent token overflow
   * @param {Array} history 
   * @returns {Array<{role: string, content: string}>}
   */
  static sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    
    // Retain only last 10 messages
    return history
      .slice(-10)
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .map(item => ({
        role: item.role,
        content: item.content.slice(0, 2000), // Max 2000 chars per historical turn
      }));
  }

  /**
   * Helper to invoke OpenAI-compatible endpoints (OpenAI, Gemini, Groq)
   */
  static async _callOpenAICompatible({ endpoint, apiKey, model, messages, timeout = 25000 }) {
    const response = await axios.post(
      endpoint,
      {
        model,
        messages,
        temperature: 0.6,
        max_tokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : null;
  }

  /**
   * Main conversational chat method supporting multi-tier AI providers:
   * 1. Client-supplied custom API key / provider (OpenAI, Gemini, Groq)
   * 2. Server-configured OpenAI, Gemini, or Groq
   * 3. Free Neural LLM Gateway (Pollinations)
   * 4. Contextual Knowledge Fallback Engine
   *
   * @param {Object} params
   * @param {string} params.message
   * @param {Array} [params.history]
   * @param {string} [params.userId]
   * @param {string} [params.customApiKey]
   * @param {string} [params.customProvider]
   * @param {string} [params.customModel]
   * @returns {Promise<{success: boolean, message: string, isResearchTopic: boolean, suggestedTopic: string|null, provider: string}>}
   */
  static async chat({
    message,
    history = [],
    userId = null,
    customApiKey = null,
    customProvider = null,
    customModel = null,
  }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        success: false,
        message: "Please enter a message to begin our conversation.",
        isResearchTopic: false,
        suggestedTopic: null,
      };
    }

    const trimmedMessage = message.trim();
    const cleanHistory = this.sanitizeHistory(history);
    const { isResearchTopic, suggestedTopic } = this.detectResearchIntent(trimmedMessage);

    // Fast path for deterministic unit test suites
    if (process.env.NODE_ENV === 'test') {
      const testReply = generateContextualResponse({
        message: trimmedMessage,
        history: cleanHistory,
        isResearchTopic,
        suggestedTopic,
      });
      return {
        success: true,
        message: testReply,
        isResearchTopic,
        suggestedTopic,
        provider: 'test-knowledge',
      };
    }

    const messages = [
      { role: 'system', content: HELPER_SYSTEM_PROMPT },
      ...cleanHistory,
      { role: 'user', content: trimmedMessage },
    ];

    let reply = null;
    let usedProvider = 'knowledge-engine';

    // -----------------------------------------------------------------------
    // Tier 1: User-Supplied Custom API Key (from UI settings)
    // -----------------------------------------------------------------------
    const effectiveProvider = (customProvider || '').toLowerCase();
    const effectiveKey = (customApiKey || '').trim();

    if (effectiveKey) {
      try {
        if (effectiveProvider === 'gemini') {
          logger.info('HELPER', `Calling Custom Gemini for: "${trimmedMessage.slice(0, 40)}..."`);
          reply = await this._callOpenAICompatible({
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            apiKey: effectiveKey,
            model: customModel || 'gemini-1.5-flash',
            messages,
          });
          if (reply) usedProvider = 'gemini-custom';
        } else if (effectiveProvider === 'groq') {
          logger.info('HELPER', `Calling Custom Groq for: "${trimmedMessage.slice(0, 40)}..."`);
          reply = await this._callOpenAICompatible({
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: effectiveKey,
            model: customModel || 'llama-3.3-70b-versatile',
            messages,
          });
          if (reply) usedProvider = 'groq-custom';
        } else {
          logger.info('HELPER', `Calling Custom OpenAI for: "${trimmedMessage.slice(0, 40)}..."`);
          reply = await this._callOpenAICompatible({
            endpoint: `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
            apiKey: effectiveKey,
            model: customModel || 'gpt-4o-mini',
            messages,
          });
          if (reply) usedProvider = 'openai-custom';
        }
      } catch (err) {
        logger.warn('HELPER', `Custom provider ${effectiveProvider} call failed: ${err.message}. Proceeding to fallback.`);
      }
    }

    // -----------------------------------------------------------------------
    // Tier 2: Server-Side OpenAI
    // -----------------------------------------------------------------------
    if (!reply && env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim()) {
      try {
        logger.info('HELPER', `Calling Server OpenAI (${env.OPENAI_MODEL || 'gpt-4o-mini'})`);
        reply = await this._callOpenAICompatible({
          endpoint: `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
          apiKey: env.OPENAI_API_KEY.trim(),
          model: env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
        });
        if (reply) usedProvider = 'openai-server';
      } catch (err) {
        logger.warn('HELPER', `Server OpenAI call failed (${err.message}).`);
      }
    }

    // -----------------------------------------------------------------------
    // Tier 3: Server-Side Gemini or Groq
    // -----------------------------------------------------------------------
    if (!reply && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      try {
        logger.info('HELPER', 'Calling Server Google Gemini');
        reply = await this._callOpenAICompatible({
          endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          apiKey: process.env.GEMINI_API_KEY.trim(),
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          messages,
        });
        if (reply) usedProvider = 'gemini-server';
      } catch (err) {
        logger.warn('HELPER', `Server Gemini call failed: ${err.message}`);
      }
    }

    if (!reply && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      try {
        logger.info('HELPER', 'Calling Server Groq');
        reply = await this._callOpenAICompatible({
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: process.env.GROQ_API_KEY.trim(),
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
        });
        if (reply) usedProvider = 'groq-server';
      } catch (err) {
        logger.warn('HELPER', `Server Groq call failed: ${err.message}`);
      }
    }

    // -----------------------------------------------------------------------
    // Tier 4: Free Neural LLM Gateway (Pollinations)
    // -----------------------------------------------------------------------
    if (!reply) {
      try {
        logger.info('HELPER', 'Connecting to Free Neural LLM Gateway...');
        const pollRes = await axios.post(
          'https://text.pollinations.ai/',
          {
            messages,
            model: 'openai',
            jsonMode: false,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 6500, // 6.5s strict timeout to prevent user waiting
          }
        );

        if (pollRes.data && typeof pollRes.data === 'string' && pollRes.data.trim().length > 5) {
          reply = pollRes.data.trim();
          usedProvider = 'neural-free';
        }
      } catch (err) {
        logger.info('HELPER', `Free neural gateway unavailable (${err.message}). Using built-in contextual engine.`);
      }
    }

    // -----------------------------------------------------------------------
    // Tier 5: Contextual Knowledge Engine (Guaranteed 100% Uptime Fallback)
    // -----------------------------------------------------------------------
    if (!reply) {
      reply = generateContextualResponse({
        message: trimmedMessage,
        history: cleanHistory,
        isResearchTopic,
        suggestedTopic,
      });
      usedProvider = 'contextual-knowledge';
    }

    return {
      success: true,
      message: reply,
      isResearchTopic,
      suggestedTopic,
      provider: usedProvider,
    };
  }
}
