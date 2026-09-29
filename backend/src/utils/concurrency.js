import { logger } from './logger.js';

/**
 * Execute an array of items through an async worker function with a controlled concurrency limit
 * @param {Array<T>} items - Items to process
 * @param {number} limit - Maximum concurrent executions
 * @param {Function} workerFn - Async function (item, index) => Promise<R>
 * @returns {Promise<Array<R>>} Results in original order
 */
export const runWithConcurrency = async (items = [], limit = 3, workerFn) => {
  if (!items || items.length === 0) return [];
  if (limit < 1) limit = 1;

  const results = new Array(items.length);
  let currentIndex = 0;

  const runWorker = async (workerId) => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];

      try {
        logger.debug('CONCURRENCY', `Worker ${workerId} executing task ${index + 1}/${items.length}`);
        results[index] = await workerFn(item, index);
      } catch (error) {
        logger.warn('CONCURRENCY', `Worker ${workerId} task ${index + 1} failed: ${error.message}`);
        results[index] = { error, failed: true };
      }
    }
  };

  const poolSize = Math.min(limit, items.length);
  const workers = Array.from({ length: poolSize }, (_, id) => runWorker(id + 1));

  await Promise.all(workers);
  return results;
};
