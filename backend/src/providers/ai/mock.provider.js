import { AIProvider } from './aiProvider.js';
import { logger } from '../../utils/logger.js';
import { AISchemaValidationError } from '../../utils/errors.js';

export class MockAIProvider extends AIProvider {
  constructor() {
    super('MockAIProvider');
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.3, maxTokens = 2500 }) {
    logger.info('MOCK_AI', `Generating mock text for prompt: "${userPrompt.slice(0, 60)}..."`);
    return `[Mock AI Response] Analysis for: ${userPrompt.slice(0, 100)}`;
  }

  async generateStructuredOutput({
    systemPrompt,
    userPrompt,
    validator = null,
    temperature = 0.2,
    maxTokens = 3000,
  }) {
    logger.info('MOCK_AI', `Generating mock structured output for prompt: "${userPrompt.slice(0, 60)}..."`);

    let result = {};

    // Dynamic mock generation matching expected agent schemas based on prompt keywords
    if (
      systemPrompt.includes('Technical Writer') ||
      systemPrompt.includes('Writer') ||
      userPrompt.includes('Evidence Package') ||
      userPrompt.includes('STRICT JSON containing')
    ) {
      result = {
        title: 'Comprehensive Assessment: The Impact of Artificial Intelligence on Employment in India',
        executiveSummary: 'Artificial intelligence is catalyzing a dual-force structural transformation across India\'s workforce. While entry-level customer support and routine software maintenance roles face rapid automation pressures [S1], new demand for specialized AI architects, prompt engineers, and machine learning infrastructure leads to significant job creation [S2]. This synthesis reconciles empirical findings across government and industry reports to chart transition pathways.',
        keyFindings: [
          {
            title: 'Routine Automation and Reskilling Imperatives',
            explanation: 'Generative AI is projected to alter approximately 4.5 million IT jobs in India over the next three years, necessitating widespread corporate upskilling programs [S1].',
            citations: ['S1'],
          },
          {
            title: 'Accelerated Hiring for High-Complexity AI Roles',
            explanation: 'Recruitment demand for machine learning specialists and AI data engineers surged by 120% year-over-year in primary tech hubs [S2].',
            citations: ['S2'],
          },
        ],
        detailedAnalysis: [
          {
            subQuestionId: 'SQ1',
            question: 'What are the current AI-related job displacement trends in India?',
            analysis: 'Empirical data indicates that repetitive software testing and basic business process management (BPM) roles are experiencing early contraction [S1]. However, comprehensive displacement remains mitigated by concurrent enterprise growth.',
            citations: ['S1'],
          },
          {
            subQuestionId: 'SQ2',
            question: 'What new employment roles and skill demands are emerging due to AI in India?',
            analysis: 'Indian technology firms are pivoting hiring budgets toward senior systems architects, LLM fine-tuning specialists, and AI governance officers [S2].',
            citations: ['S2'],
          },
          {
            subQuestionId: 'SQ3',
            question: 'What are the government policies and industry forecasts on AI employment impact?',
            analysis: 'National policy frameworks emphasize public-private partnership training initiatives to prepare graduates for high-value AI integration [S3].',
            citations: ['S3'],
          },
        ],
        statistics: [
          {
            metric: 'Workforce Reskilling Requirement',
            value: '4.5M',
            context: 'IT roles requiring reskilling over the next 3 years',
            sourceCitation: '[S1]',
          },
          {
            metric: 'Specialized AI Roles Surge',
            value: '120%',
            context: 'Increase in demand for specialized AI roles',
            sourceCitation: '[S2]',
          },
        ],
        contradictions: [
          {
            topic: 'Net Employment Trajectory',
            explanation: 'Source [S1] highlights potential net contraction of 500,000 legacy positions, while Source [S2] forecasts net expansion of 1.2 million technology jobs.',
            citations: ['S1', 'S2'],
            resolution: 'Displacement occurs predominantly in entry-level support, whereas job creation concentrates in higher-value digital services.',
          },
        ],
        limitations: [
          'Empirical findings concentrate primarily on tier-1 technology hubs (Bengaluru, Hyderabad, Pune).',
          'Long-term macroeconomic models depend on uncertain generative AI adoption rates.',
        ],
        conclusion: 'The trajectory of AI adoption in India points toward an augmentation-first model rather than outright structural job collapse [S1, S2]. Success hinges upon rapid national reskilling and institutional policy alignment.',
        markdown: '# Comprehensive Assessment: The Impact of Artificial Intelligence on Employment in India\n\n## Executive Summary\nArtificial intelligence is catalyzing a dual-force structural transformation across India\'s workforce. While entry-level customer support and routine software maintenance roles face rapid automation pressures [S1], new demand for specialized AI architects leads to significant job creation [S2].\n\n## Key Findings\n- **Routine Automation**: Generative AI is projected to alter 4.5M IT jobs [S1].\n- **Role Surge**: Demand for specialized AI engineers surged by 120% [S2].\n\n## Detailed Analysis\n### AI Displacement Trends\nEmpirical data indicates routine testing roles are contracting [S1].\n\n## Conclusion\nThe trajectory of AI adoption in India points toward an augmentation-first model [S1, S2].',
      };
    } else if (
      systemPrompt.includes('Planner Agent') ||
      systemPrompt.includes('Decomposition') ||
      userPrompt.includes('sub-questions') ||
      userPrompt.includes('Decompose') ||
      userPrompt.includes('plan')
    ) {
      result = {
        researchTopic: userPrompt,
        objective: 'Analyze the comprehensive employment and labor market transformation in India driven by AI adoption.',
        subQuestions: [
          {
            id: 'SQ1',
            question: 'What are the current AI-related job displacement trends in India?',
            searchQueries: [
              'AI job displacement India IT sector',
              'impact of generative AI on Indian jobs statistics',
            ],
            evidenceType: 'statistics',
          },
          {
            id: 'SQ2',
            question: 'What new employment roles and skill demands are emerging due to AI in India?',
            searchQueries: [
              'AI job creation India tech talent',
              'emerging AI skills demand NASSCOM India',
            ],
            evidenceType: 'industry_reports',
          },
          {
            id: 'SQ3',
            question: 'What are the government policies and industry forecasts on AI employment impact?',
            searchQueries: [
              'India National AI Strategy employment',
              'IT industry forecasts AI employment India',
            ],
            evidenceType: 'government_reports',
          },
        ],
      };
    } else if (systemPrompt.includes('Summarizer Agent') || userPrompt.includes('source content')) {
      result = {
        sourceId: 'mock-source-id',
        summary: 'India is experiencing a profound shift in tech employment, where routine coding and support are automated while specialized AI architecture roles grow by 34%.',
        keyClaims: [
          {
            claim: 'Generative AI is projected to alter 4.5 million IT jobs in India over the next 3 years.',
            evidence: 'Survey across 400 Indian tech leaders',
            importance: 'high',
          },
          {
            claim: 'Demand for AI prompt engineers and cloud architects has increased by 120%.',
            evidence: 'Indian job recruitment index 2025',
            importance: 'medium',
          },
        ],
        statistics: [
          {
            value: '4.5M',
            context: 'IT roles requiring reskilling',
          },
          {
            value: '120%',
            context: 'surge in specialized AI roles demand',
          },
        ],
        limitations: [
          'Study restricted to top metro tech hubs (Bengaluru, Hyderabad, Pune).',
        ],
      };
    } else if (systemPrompt.includes('FactChecker Agent') || userPrompt.includes('fact-check')) {
      result = {
        verifiedClaims: [
          {
            claim: 'Demand for AI prompt engineers and machine learning talent is surging in India',
            supportingSources: ['S1', 'S2'],
            confidence: 'high',
            status: 'verified',
            notes: 'Consistent across both industry recruitment reports',
          },
        ],
        disputedClaims: [
          {
            claim: 'Net job losses will exceed net job gains by 2026',
            supportingSources: ['S1'],
            confidence: 'medium',
            status: 'disputed',
            notes: 'Source S1 claims net reduction, whereas Source S2 projects net 15% workforce growth',
          },
        ],
        unsupportedClaims: [],
        contradictions: [
          {
            claimA: 'Net IT employment will shrink by 500,000 workers',
            sourceA: 'S1',
            claimB: 'Net IT employment will expand by 1.2 million workers',
            sourceB: 'S2',
            explanation: 'Contradictory assumptions regarding the speed of enterprise AI adoption',
            resolution: 'Displacement is rapid in entry-level support, but creation is concentrated in higher-value services',
          },
        ],
      };
    } else {
      // Generic structured output fallback
      result = {
        status: 'success',
        topic: userPrompt,
        timestamp: new Date().toISOString(),
      };
    }

    if (validator && typeof validator === 'function') {
      const validation = validator(result);
      if (!validation.valid) {
        throw new AISchemaValidationError(`Mock output failed validation: ${validation.errors.join(', ')}`, JSON.stringify(result));
      }
    }

    return result;
  }
}
