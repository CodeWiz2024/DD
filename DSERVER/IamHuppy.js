const request = require('request');

/**
 * Performs repeated HTTP requests to a URL at specified intervals
 * @param {string} url - The URL to request
 * @param {number} requestsPerInterval - Number of requests per interval
 * @param {number} intervalMs - Interval in milliseconds
 * @param {Object} options - Optional configuration
 * @param {Object} options.agent - HTTP/HTTPS agent for proxy support
 * @returns {Object} Controller object with stop method
 */
const startRequestStorm = (url, requestsPerInterval, intervalMs, options = {}) => {
  // Input validation
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a valid string');
  }
  if (!Number.isInteger(requestsPerInterval) || requestsPerInterval <= 0) {
    throw new Error('Requests per interval must be a positive integer');
  }
  if (!Number.isInteger(intervalMs) || intervalMs <= 0) {
    throw new Error('Interval must be a positive integer (milliseconds)');
  }

  let successCount = 0;
  let errorCount = 0;
  let isRunning = true;
  const { agent } = options;

  const intervalId = setInterval(() => {
    if (!isRunning) return;

    for (let i = 0; i < requestsPerInterval; i++) {
      const requestOptions = { url };
      
      // Add proxy agent if provided
      if (agent) {
        requestOptions.agent = agent;
        requestOptions.agentOptions = { keepAlive: true };
      }

      request(requestOptions, (error) => {
        if (error) {
          errorCount++;
          console.error(`[ERROR] Request failed: ${error.message}`);
        } else {
          successCount++;
        }
      });
    }

    console.log(`[STATS] Success: ${successCount}, Errors: ${errorCount}, Total: ${successCount + errorCount}${agent ? ' [TOR PROXY]' : ''}`);
  }, intervalMs);

  return {
    stop: () => {
      isRunning = false;
      clearInterval(intervalId);
      console.log(`[STOPPED] Final stats - Success: ${successCount}, Errors: ${errorCount}`);
    },
    getStats: () => ({ successCount, errorCount, total: successCount + errorCount })
  };
};

module.exports = startRequestStorm; 