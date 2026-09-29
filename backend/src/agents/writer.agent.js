import { getAIProvider } from '../providers/ai/aiProvider.js';
import { WRITER_SYSTEM_PROMPT, buildWriterUserPrompt } from '../prompts/writer.prompt.js';
import { validateResearchReport } from '../validators/report.validator.js';
import { EvidenceService } from '../services/evidence.service.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { ResearchReport } from '../models/ResearchReport.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class WriterAgent {
  constructor({ aiProvider = null } = {}) {
    this.name = 'WriterAgent';
    this.aiProvider = aiProvider;
  }

  async getProvider() {
    if (!this.aiProvider) {
      this.aiProvider = await getAIProvider();
    }
    return this.aiProvider;
  }

  /**
   * Synthesize full research report from an aggregated Evidence Package
   * @param {Object} options
   * @param {string} options.sessionId
   * @param {Object} [options.evidencePackage]
   * @returns {Promise<{ report: Object, generated: Object, evidencePackage: Object }>}
   */
  async run({ sessionId, evidencePackage = null } = {}) {
    logger.info('WRITER', `Starting report synthesis for session: ${sessionId || 'in-memory'}`);

    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.WRITING,
        progress: 80,
        currentStep: 'Synthesizing evidence and drafting comprehensive research report...',
      });
    }

    // 1. Resolve Evidence Package
    let activeEvidence = evidencePackage;
    if (!activeEvidence) {
      if (!sessionId) {
        throw new NotFoundError('Either sessionId or evidencePackage must be provided to WriterAgent');
      }
      activeEvidence = await EvidenceService.buildEvidencePackage({ sessionId });
    }

    const provider = await this.getProvider();
    const userPrompt = buildWriterUserPrompt(activeEvidence);

    logger.info('WRITER', `Invoking AI model to draft report for topic: "${activeEvidence.researchTopic}"`);

    // 2. Generate structured report via AI Provider
    const generated = await provider.generateStructuredOutput({
      systemPrompt: WRITER_SYSTEM_PROMPT,
      userPrompt,
      validator: validateResearchReport,
      temperature: 0.25,
      maxTokens: 4000,
    });

    // 3. Assemble complete Citation Reference registry
    const citationRegistry = (activeEvidence.sources || []).map((s) => ({
      citationId: s.citationId || 'S?',
      sourceId: s._id || s.id || null,
      title: s.title || 'Untitled Source',
      url: s.url || '',
      domain: s.domain || '',
      publishedAt: s.publishedDate || null,
      sourceType: s.sourceType || 'general',
    }));

    // If generated markdown doesn't have References appendix, append it
    let fullMarkdown = generated.markdown || '';
    if (!fullMarkdown.includes('## References') && !fullMarkdown.includes('## Sources')) {
      const referencesSection = [
        '\n\n## References and Consulted Sources',
        ...citationRegistry.map(
          (c) => `- **[${c.citationId}]** [${c.title}](${c.url}) (${c.domain || 'web'})`
        ),
      ].join('\n');
      fullMarkdown += referencesSection;
    }

    let reportDoc = null;

    // 4. Persist to MongoDB if session exists
    if (sessionId) {
      reportDoc = await ResearchReport.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          title: generated.title,
          executiveSummary: generated.executiveSummary,
          content: {
            keyFindings: generated.keyFindings || [],
            detailedAnalysis: generated.detailedAnalysis || [],
            statistics: generated.statistics || [],
            contradictions: generated.contradictions || [],
            conclusion: generated.conclusion || '',
          },
          markdown: fullMarkdown,
          citations: citationRegistry,
          limitations: generated.limitations || [],
        },
        { upsert: true, new: true }
      );

      await ResearchSession.findByIdAndUpdate(sessionId, {
        progress: 88,
        currentStep: 'Report drafted. Proceeding to citation validation...',
      });

      logger.info('WRITER', `Research report successfully stored in MongoDB for session: ${sessionId}`);
    } else {
      reportDoc = {
        title: generated.title,
        executiveSummary: generated.executiveSummary,
        content: {
          keyFindings: generated.keyFindings,
          detailedAnalysis: generated.detailedAnalysis,
          statistics: generated.statistics,
          contradictions: generated.contradictions,
          conclusion: generated.conclusion,
        },
        markdown: fullMarkdown,
        citations: citationRegistry,
        limitations: generated.limitations,
      };
    }

    return {
      report: reportDoc,
      generated,
      evidencePackage: activeEvidence,
    };
  }
}
