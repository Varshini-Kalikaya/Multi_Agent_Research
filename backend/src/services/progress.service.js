import { emitToSession } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const ResearchEvents = {
  STARTED: 'research:started',
  PLANNING: 'research:planning',
  SEARCHING: 'research:searching',
  SUMMARIZING: 'research:summarizing',
  FACT_CHECKING: 'research:fact-checking',
  WRITING: 'research:writing',
  VALIDATION: 'research:validation',
  COMPLETED: 'research:completed',
  ERROR: 'research:error',
};

export class ProgressService {
  /**
   * Helper to dispatch standard progress payload
   */
  static emit(sessionId, event, { stage, progress, message, data = null } = {}) {
    const payload = {
      stage,
      progress,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    logger.info('PROGRESS', `[${event}] (${progress}%) - ${message}`);
    emitToSession(sessionId, event, payload);
    return payload;
  }

  static notifyStarted(sessionId, { topic, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.STARTED, {
      stage: 'INIT',
      progress: 5,
      message: `Research session initialized for topic: "${topic}"`,
      data: { topic, ...(data || {}) },
    });
  }

  static notifyPlanning(sessionId, { message = 'Decomposing topic into sub-questions...', subQuestions = null, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.PLANNING, {
      stage: 'PLANNING',
      progress: 15,
      message,
      data: { subQuestions, ...(data || {}) },
    });
  }

  static notifySearching(sessionId, { query = '', subQuestionId = '', totalQueries = 0, queryIndex = 0, progress = 25, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.SEARCHING, {
      stage: 'SEARCHING',
      progress,
      message: query ? `Searching: "${query}"` : 'Executing parallel web search queries...',
      data: { query, subQuestionId, totalQueries, queryIndex, ...(data || {}) },
    });
  }

  static notifySummarizing(sessionId, { sourceTitle = '', citationId = '', processedCount = 0, totalSources = 0, progress = 50, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.SUMMARIZING, {
      stage: 'SUMMARIZING',
      progress,
      message: sourceTitle ? `Extracting evidence from [${citationId}]: "${sourceTitle.slice(0, 45)}..."` : 'Extracting claims and statistics from sources...',
      data: { sourceTitle, citationId, processedCount, totalSources, ...(data || {}) },
    });
  }

  static notifyFactChecking(sessionId, { message = 'Cross-referencing claims and analyzing contradictions...', progress = 70, verifiedCount = 0, contradictionCount = 0, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.FACT_CHECKING, {
      stage: 'FACT_CHECKING',
      progress,
      message,
      data: { verifiedCount, contradictionCount, ...(data || {}) },
    });
  }

  static notifyWriting(sessionId, { section = 'Executive Summary', progress = 82, message = 'Drafting comprehensive research report...', data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.WRITING, {
      stage: 'WRITING',
      progress,
      message: `${message} (${section})`,
      data: { section, ...(data || {}) },
    });
  }

  static notifyValidation(sessionId, { message = 'Validating inline citation integrity...', progress = 92, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.VALIDATION, {
      stage: 'VALIDATION',
      progress,
      message,
      data,
    });
  }

  static notifyCompleted(sessionId, { report = null, stats = null, data = null } = {}) {
    return this.emit(sessionId, ResearchEvents.COMPLETED, {
      stage: 'COMPLETED',
      progress: 100,
      message: 'Research successfully completed. Report ready.',
      data: { report, stats, ...(data || {}) },
    });
  }

  static notifyError(sessionId, { error, message = 'An error occurred during research execution' } = {}) {
    return this.emit(sessionId, ResearchEvents.ERROR, {
      stage: 'FAILED',
      progress: 0,
      message: `${message}: ${error?.message || error}`,
      data: { error: error?.message || String(error) },
    });
  }
}
