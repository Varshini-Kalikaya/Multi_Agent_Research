import mongoose from 'mongoose';
import {
  ResearchSession,
  ResearchSessionStatus,
  Source,
  SourceSummary,
  FactCheck,
  ResearchReport,
} from '../models/index.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/research
 * Create a new research session
 */
export const createSession = async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'A valid research topic is required',
      });
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length > 500) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Research topic must not exceed 500 characters',
      });
    }

    const session = await ResearchSession.create({
      topic: trimmedTopic,
      status: ResearchSessionStatus.CREATED,
      progress: 0,
      currentStep: 'Session initialized',
      startedAt: new Date(),
    });

    logger.info('RESEARCH', `Session created: ${session._id} for topic: "${trimmedTopic}"`);

    return res.status(201).json({
      _id: session._id,
      sessionId: session._id,
      status: session.status,
      topic: session.topic,
      progress: session.progress,
      currentStep: session.currentStep,
      startedAt: session.startedAt,
      createdAt: session.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/research/:sessionId
 * Fetch research session status and details
 */
export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const session = await ResearchSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Research session not found',
      });
    }

    return res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/research
 * List all research sessions (for history)
 */
export const listSessions = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      ResearchSession.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ResearchSession.countDocuments(),
    ]);

    return res.status(200).json({
      total,
      page,
      limit,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/research/:sessionId/sources
 * Fetch collected sources for a session
 */
export const getSessionSources = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const sources = await Source.find({ sessionId }).sort({ citationId: 1 }).lean();
    return res.status(200).json({ sources, count: sources.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/research/:sessionId/report
 * Fetch final research report for a session
 */
export const getSessionReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const report = await ResearchReport.findOne({ sessionId });
    if (!report) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Report not generated yet for this session',
      });
    }

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/research/:sessionId
 * Delete a research session and all related records
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const session = await ResearchSession.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Research session not found',
      });
    }

    // Cascade delete related records
    await Promise.all([
      Source.deleteMany({ sessionId }),
      SourceSummary.deleteMany({ sessionId }),
      FactCheck.deleteMany({ sessionId }),
      ResearchReport.deleteMany({ sessionId }),
    ]);

    logger.info('RESEARCH', `Session deleted: ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'Research session and related data deleted successfully',
      sessionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/plan
 * Trigger Planner Agent for a research session
 */
export const planSessionController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.planSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      researchPlan: result.plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/search
 * Trigger Search Agent for a research session
 */
export const searchSessionController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.searchSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      sourcesCount: result.sources.length,
      sources: result.sources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/summarize
 * Trigger Source Processing & Summarizer Agent for a session
 */
export const summarizeSessionController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.summarizeSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      summariesCount: result.summaries.length,
      accessibleCount: result.accessibleCount,
      inaccessibleCount: result.inaccessibleCount,
      summaries: result.summaries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/fact-check
 * Trigger Fact-Checking Agent for a session
 */
export const factCheckSessionController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.factCheckSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      factCheck: result.factCheck,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/write
 * Trigger Writer Agent to synthesize the research report
 */
export const writeReportSessionController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.writeReportSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      report: result.report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/validate-citations
 * Trigger Citation Validation & Correction
 */
export const validateCitationsController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.validateCitationsSession(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      report: result.report,
      validation: result.validation,
      wasCorrected: result.wasCorrected,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/research/:sessionId/execute
 * Execute the entire autonomous pipeline from planning to final validated report
 */
export const executeFullPipelineController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid session ID format',
      });
    }

    const { OrchestratorAgent } = await import('../agents/orchestrator.agent.js');
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.executeFullResearchPipeline(sessionId);

    return res.status(200).json({
      sessionId: result.session._id,
      status: result.session.status,
      progress: result.session.progress,
      currentStep: result.session.currentStep,
      report: result.report,
      validation: result.validation,
      wasCorrected: result.wasCorrected,
    });
  } catch (error) {
    next(error);
  }
};


