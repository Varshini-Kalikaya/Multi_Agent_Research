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
    const lower = trimmed.toLowerCase();

    // Direct research inquiry keywords
    const researchPatterns = [
      /^(?:research|investigate|study|explore|analyze)\s+(?:the\s+)?(.+)/i,
      /^(?:what is the impact of|how does|what are the effects of)\s+(.+)/i,
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
   * Main conversational chat method
   * @param {Object} params
   * @param {string} params.message
   * @param {Array} [params.history]
   * @param {string} [params.userId]
   * @returns {Promise<{success: boolean, message: string, isResearchTopic: boolean, suggestedTopic: string|null}>}
   */
  static async chat({ message, history = [], userId = null }) {
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

    // If an OpenAI API Key is actively configured in the server environment, invoke OpenAI
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim()) {
      try {
        logger.info('HELPER', `Calling OpenAI (${env.OPENAI_MODEL || 'gpt-4o-mini'}) for user prompt: "${trimmedMessage.slice(0, 50)}..."`);
        
        const messages = [
          { role: 'system', content: HELPER_SYSTEM_PROMPT },
          ...cleanHistory,
          { role: 'user', content: trimmedMessage },
        ];

        const response = await axios.post(
          `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
          {
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages,
            temperature: 0.5,
            max_tokens: 1500,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${env.OPENAI_API_KEY.trim()}`,
            },
            timeout: 30000,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string') {
          return {
            success: true,
            message: content.trim(),
            isResearchTopic,
            suggestedTopic,
          };
        }
      } catch (err) {
        logger.warn('HELPER', `OpenAI call failed (${err.message}). Gracefully falling back to knowledge engine.`);
      }
    }

    // High-quality contextual fallback knowledge engine (runs offline, in tests, or if OpenAI is unreachable)
    const reply = generateContextualResponse({
      message: trimmedMessage,
      history: cleanHistory,
      isResearchTopic,
      suggestedTopic,
    });

    return {
      success: true,
      message: reply,
      isResearchTopic,
      suggestedTopic,
    };
  }
}
