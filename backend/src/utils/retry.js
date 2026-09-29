import { logger } from './logger.js';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute an async function with exponential backoff and jitter
 * @param {Function} fn - Async operation to execute
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelayMs - Maximum delay cap in ms (default: 10000)
 * @param {Function} options.shouldRetry - Predicate function returning boolean
 * @param {string} options.tag - Logger tag
 */
export const retryWithBackoff = async (
  fn,
  {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = () => true,
    tag = 'RETRY',
  } = {}
) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn(attempt);
    } catch (error) {
      attempt++;

      if (attempt > maxRetries || !shouldRetry(error)) {
        logger.error(tag, `Exhausted all ${maxRetries} retries or unretryable error: ${error.message}`);
        throw error;
      }

      // Exponential backoff with full jitter
      const delay = Math.min(
        maxDelayMs,
        Math.floor(baseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5))
      );

      logger.warn(tag, `Attempt ${attempt}/${maxRetries} failed (${error.message}). Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
};
