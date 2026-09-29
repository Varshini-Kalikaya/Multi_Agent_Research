import { getAIProvider } from '../providers/ai/aiProvider.js';
import { PLANNER_SYSTEM_PROMPT, buildPlannerUserPrompt } from '../prompts/planner.prompt.js';
import { validateResearchPlan } from '../validators/plan.validator.js';
import { ResearchSession, ResearchSessionStatus } from '../models/ResearchSession.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class PlannerAgent {
  constructor({ aiProvider = null } = {}) {
    this.name = 'PlannerAgent';
    this.aiProvider = aiProvider;
  }

  async getProvider() {
    if (!this.aiProvider) {
      this.aiProvider = await getAIProvider();
    }
    return this.aiProvider;
  }

  /**
   * Run the Planner Agent to decompose a research topic
   * @param {Object} params
   * @param {string} params.topic - Research topic or question
   * @param {string} [params.sessionId] - Optional session ID to persist plan in MongoDB
   * @param {Object} [context] - Additional context/dependencies
   * @returns {Promise<Object>} Validated research plan
   */
  async run({ topic, sessionId = null }, context = {}) {
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      throw new Error('PlannerAgent requires a valid research topic');
    }

    const trimmedTopic = topic.trim();
    logger.info('PLANNER', `Starting research planning for topic: "${trimmedTopic}"`, { sessionId });

    // Update session state in database if sessionId provided
    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        status: ResearchSessionStatus.PLANNING,
        progress: 10,
        currentStep: 'Decomposing research objective and generating sub-questions...',
      });
    }

    const provider = await this.getProvider();
    const userPrompt = buildPlannerUserPrompt(trimmedTopic);

    // Call LLM with schema validation & self-correction loop
    const rawPlan = await provider.generateStructuredOutput({
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      userPrompt,
      validator: validateResearchPlan,
      temperature: 0.2,
      maxTokens: 2500,
    });

    // Enforce configured sub-question limit
    const maxSubQuestions = env.MAX_SUB_QUESTIONS || 5;
    const subQuestions = (rawPlan.subQuestions || []).slice(0, maxSubQuestions).map((sq, index) => ({
      id: sq.id || `SQ${index + 1}`,
      question: sq.question.trim(),
      searchQueries: (sq.searchQueries || []).map((q) => q.trim()).filter(Boolean),
      evidenceType: sq.evidenceType || 'general',
    }));

    const validatedPlan = {
      researchTopic: rawPlan.researchTopic || trimmedTopic,
      objective: rawPlan.objective || `Conduct deep research into ${trimmedTopic}`,
      subQuestions,
    };

    logger.info('PLANNER', `Plan generated successfully with ${subQuestions.length} sub-questions`, {
      subQuestionIds: subQuestions.map((sq) => sq.id),
    });

    // Persist plan in ResearchSession
    if (sessionId) {
      await ResearchSession.findByIdAndUpdate(sessionId, {
        researchPlan: validatedPlan,
        progress: 20,
        currentStep: `Research plan created with ${subQuestions.length} sub-questions`,
      });
    }

    return validatedPlan;
  }
}
