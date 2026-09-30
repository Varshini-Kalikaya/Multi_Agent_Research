import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  createSession,
  getSession,
  listSessions,
  getSessionSources,
  getSessionReport,
  deleteSession,
  planSessionController,
  searchSessionController,
  summarizeSessionController,
  factCheckSessionController,
  writeReportSessionController,
  validateCitationsController,
  executeFullPipelineController,
} from '../controllers/research.controller.js';

const router = Router();

// Apply optional authentication so logged-in users get sessions linked to their account
router.use(optionalAuth);

// Research session routes
router.post('/', createSession);
router.get('/', listSessions);
router.get('/:sessionId', getSession);
router.post('/:sessionId/plan', planSessionController);
router.post('/:sessionId/search', searchSessionController);
router.post('/:sessionId/summarize', summarizeSessionController);
router.post('/:sessionId/fact-check', factCheckSessionController);
router.post('/:sessionId/write', writeReportSessionController);
router.post('/:sessionId/validate-citations', validateCitationsController);
router.post('/:sessionId/execute', executeFullPipelineController);
router.get('/:sessionId/sources', getSessionSources);
router.get('/:sessionId/report', getSessionReport);
router.delete('/:sessionId', deleteSession);

export default router;
