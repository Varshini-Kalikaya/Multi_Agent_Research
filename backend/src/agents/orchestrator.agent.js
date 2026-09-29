import { PlannerAgent } from './planner.agent.js';
import { SearchAgent } from './search.agent.js';
import { SummarizerAgent } from './summarizer.agent.js';
import { FactCheckerAgent } from './factChecker.agent.js';
import { WriterAgent } from './writer.agent.js';
import { ProgressService } from '../services/progress.service.js';
import { Source } from '../models/Source.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class OrchestratorAgent {
  constructor({ aiProvider = null, searchProvider = null } = {}) {
    this.name = 'OrchestratorAgent';
    this.aiProvider = aiProvider;
    this.searchProvider = searchProvider;
    this.plannerAgent = new PlannerAgent({ aiProvider });
    this.searchAgent = new SearchAgent({ searchProvider });
    this.summarizerAgent = new SummarizerAgent({ aiProvider });
    this.factCheckerAgent = new FactCheckerAgent({ aiProvider });
    this.writerAgent = new WriterAgent({ aiProvider });
  }

  /**
   * Execute the Planning Phase for a research session
   * @param {string} sessionId
   * @returns {Promise<Object>} Updated session with researchPlan
   */
  async planSession(sessionId) {
    const session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    logger.info('RESEARCH', `Orchestrator executing Planning phase for session: ${sessionId}`);
    ProgressService.notifyPlanning(sessionId, { message: 'Decomposing topic into sub-questions...' });

    const plan = await this.plannerAgent.run({
      topic: session.topic,
      sessionId: session._id,
    });

    ProgressService.notifyPlanning(sessionId, {
      message: `Generated ${plan.subQuestions?.length || 0} sub-questions`,
      subQuestions: plan.subQuestions,
    });

    const updatedSession = await ResearchSession.findById(sessionId);
    return {
      session: updatedSession,
      plan,
    };
  }

  /**
   * Execute the Search Phase for a research session
   * @param {string} sessionId
   * @returns {Promise<{ session: Object, sources: Array }>}
   */
  async searchSession(sessionId) {
    let session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    // Automatically trigger planning if researchPlan does not exist yet
    if (!session.researchPlan || !session.researchPlan.subQuestions?.length) {
      logger.info('RESEARCH', `Research plan missing for ${sessionId}. Automatically generating plan first.`);
      const planResult = await this.planSession(sessionId);
      session = planResult.session;
    }

    logger.info('RESEARCH', `Orchestrator executing Search phase for session: ${sessionId}`);
    ProgressService.notifySearching(sessionId, {
      message: 'Executing parallel web search queries...',
      progress: 25,
    });

    const sources = await this.searchAgent.run({
      sessionId: session._id,
      researchPlan: session.researchPlan,
    });

    ProgressService.notifySearching(sessionId, {
      message: `Discovered and persisted ${sources.length} sources`,
      progress: 40,
    });

    const updatedSession = await ResearchSession.findById(sessionId);
    return {
      session: updatedSession,
      sources,
    };
  }

  /**
   * Execute the Source Retrieval & Summarization Phase for a research session
   * @param {string} sessionId
   * @returns {Promise<{ session: Object, summaries: Array, processedSources: Array }>}
   */
  async summarizeSession(sessionId) {
    let session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    // If no sources exist yet, autonomously run search first
    let sources = await Source.find({ sessionId });
    if (!sources || sources.length === 0) {
      logger.info('RESEARCH', `No sources found for ${sessionId}. Automatically running search first.`);
      const searchResult = await this.searchSession(sessionId);
      sources = searchResult.sources;
      session = searchResult.session;
    }

    logger.info('RESEARCH', `Orchestrator executing Summarization phase for session: ${sessionId} (${sources.length} sources)`);
    ProgressService.notifySummarizing(sessionId, {
      message: `Extracting content and claims from ${sources.length} sources...`,
      progress: 45,
      totalSources: sources.length,
    });

    const summarizerResult = await this.summarizerAgent.run({
      sessionId: session._id,
      sources,
      topic: session.topic,
    });

    ProgressService.notifySummarizing(sessionId, {
      message: `Extracted claims and statistics from ${summarizerResult.summaries?.length || 0} sources`,
      progress: 65,
    });

    const updatedSession = await ResearchSession.findById(sessionId);
    return {
      session: updatedSession,
      ...summarizerResult,
    };
  }

  /**
   * Execute the Fact-Checking and Evidence Cross-Verification Phase
   * @param {string} sessionId
   * @returns {Promise<{ session: Object, factCheck: Object }>}
   */
  async factCheckSession(sessionId) {
    let session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    const { SourceSummary } = await import('../models/SourceSummary.js');
    let summaries = await SourceSummary.find({ sessionId });
    if (!summaries || summaries.length === 0) {
      logger.info('RESEARCH', `No summaries found for ${sessionId}. Automatically running summarization first.`);
      const sumResult = await this.summarizeSession(sessionId);
      session = sumResult.session;
    }

    logger.info('RESEARCH', `Orchestrator executing Fact-Checking phase for session: ${sessionId}`);
    ProgressService.notifyFactChecking(sessionId, {
      message: 'Cross-referencing claims and analyzing contradictions...',
      progress: 70,
    });

    const factCheck = await this.factCheckerAgent.run({
      sessionId: session._id,
      topic: session.topic,
    });

    ProgressService.notifyFactChecking(sessionId, {
      message: `Fact-checking complete (${factCheck.contradictions?.length || 0} contradictions detected)`,
      progress: 75,
      verifiedCount: factCheck.verifiedClaims?.length || 0,
      contradictionCount: factCheck.contradictions?.length || 0,
    });

    const updatedSession = await ResearchSession.findById(sessionId);
    return {
      session: updatedSession,
      factCheck,
    };
  }

  /**
   * Execute the Report Writing & Synthesis Phase
   * @param {string} sessionId
   * @returns {Promise<{ session: Object, report: Object, generated: Object }>}
   */
  async writeReportSession(sessionId) {
    let session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    const { FactCheck } = await import('../models/FactCheck.js');
    let factCheck = await FactCheck.findOne({ sessionId });
    if (!factCheck) {
      logger.info('RESEARCH', `No factCheck found for ${sessionId}. Automatically running fact-checking first.`);
      const fcResult = await this.factCheckSession(sessionId);
      session = fcResult.session;
    }

    logger.info('RESEARCH', `Orchestrator executing Report Writing phase for session: ${sessionId}`);
    ProgressService.notifyWriting(sessionId, {
      message: 'Synthesizing evidence and drafting comprehensive research report...',
      progress: 80,
    });

    const writerResult = await this.writerAgent.run({
      sessionId: session._id,
    });

    ProgressService.notifyWriting(sessionId, {
      message: 'Report drafted. Proceeding to citation validation...',
      progress: 90,
    });

    const updatedSession = await ResearchSession.findById(sessionId);
    return {
      session: updatedSession,
      ...writerResult,
    };
  }

  /**
   * Execute Citation Validation & Error Correction Phase
   * @param {string} sessionId
   * @returns {Promise<{ session: Object, report: Object, validation: Object, wasCorrected: boolean }>}
   */
  async validateCitationsSession(sessionId) {
    let session = await ResearchSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Research session ${sessionId} not found`);
    }

    const { ResearchReport } = await import('../models/ResearchReport.js');
    const { CitationService } = await import('../services/citation.service.js');

    let report = await ResearchReport.findOne({ sessionId });
    if (!report) {
      logger.info('RESEARCH', `No report found for ${sessionId}. Automatically running write phase first.`);
      const writeResult = await this.writeReportSession(sessionId);
      report = writeResult.report;
      session = writeResult.session;
    }

    logger.info('RESEARCH', `Orchestrator executing Citation Validation phase for session: ${sessionId}`);
    ProgressService.notifyValidation(sessionId, {
      message: 'Validating citations and checking source integrity...',
      progress: 92,
    });

    await ResearchSession.findByIdAndUpdate(sessionId, {
      status: ResearchSessionStatus.VALIDATING,
      progress: 92,
      currentStep: 'Validating citations and checking source integrity...',
    });

    const sources = await Source.find({ sessionId }).lean();
    const result = CitationService.validateAndCorrect({
      report: report.toObject ? report.toObject() : report,
      sources,
    });

    let finalReport = report;
    if (result.wasCorrected) {
      finalReport = await ResearchReport.findOneAndUpdate(
        { sessionId },
        {
          title: result.report.title,
          executiveSummary: result.report.executiveSummary,
          content: result.report.content,
          markdown: result.report.markdown,
          limitations: result.report.limitations,
        },
        { new: true }
      );
    }

    // Mark session COMPLETED
    const completedSession = await ResearchSession.findByIdAndUpdate(
      sessionId,
      {
        status: ResearchSessionStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        currentStep: 'Research completed successfully. Citations verified.',
      },
      { new: true }
    );

    ProgressService.notifyCompleted(sessionId, {
      report: finalReport,
      stats: { sourcesCount: sources.length, wasCorrected: result.wasCorrected },
    });

    logger.info('RESEARCH', `Research pipeline COMPLETED successfully for session: ${sessionId}`);

    return {
      session: completedSession,
      report: finalReport,
      validation: result.validation,
      wasCorrected: result.wasCorrected,
    };
  }

  /**
   * Execute entire end-to-end multi-agent research pipeline autonomously
   * @param {string} sessionId
   * @returns {Promise<Object>} Final result with session and report
   */
  async executeFullResearchPipeline(sessionId) {
    try {
      logger.info('RESEARCH', `Starting full multi-agent research pipeline for session: ${sessionId}`);
      const session = await ResearchSession.findById(sessionId);
      if (session) {
        ProgressService.notifyStarted(sessionId, { topic: session.topic });
      }

      await this.planSession(sessionId);
      await this.searchSession(sessionId);
      await this.summarizeSession(sessionId);
      await this.factCheckSession(sessionId);
      await this.writeReportSession(sessionId);
      return await this.validateCitationsSession(sessionId);
    } catch (error) {
      logger.error('RESEARCH', `Pipeline execution failed for session ${sessionId}: ${error.message}`, error);
      ProgressService.notifyError(sessionId, { error });
      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.FAILED,
        error: error.message,
      });
      throw error;
    }
  }
}
