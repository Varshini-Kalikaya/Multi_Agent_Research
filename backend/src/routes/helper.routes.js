import { Router } from 'express';
import { handleHelperChat } from '../controllers/helper.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/helper/chat - Chat with Helper AI assistant (supports authenticated and guest users)
router.post('/chat', optionalAuth, handleHelperChat);

export default router;
