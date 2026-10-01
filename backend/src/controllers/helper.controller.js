import { HelperService } from '../services/helper/helperService.js';
import { logger } from '../utils/logger.js';

export const handleHelperChat = async (req, res) => {
  try {
    const { message, history, conversationId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'A non-empty message string is required.',
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Message exceeds the maximum allowable length of 4000 characters.',
      });
    }

    const userId = req.user?._id || null;

    const result = await HelperService.chat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      userId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      isResearchTopic: result.isResearchTopic,
      suggestedTopic: result.suggestedTopic,
      conversationId: conversationId || null,
    });
  } catch (error) {
    logger.error('HELPER_CONTROLLER', `Error processing helper chat: ${error.message}`, error);

    // Provide friendly response without leaking raw database or system internals
    return res.status(500).json({
      success: false,
      error: 'HelperServiceError',
      message: "Sorry, I couldn't process that request right now. Please try again in a moment.",
    });
  }
};
