// Rate limiting middleware for AI endpoints
// Prevents abuse and protects OpenAI API budget
//
// ⚠️ WARNING: This uses in-memory storage which:
// - Does NOT persist across server restarts
// - Does NOT work with multiple server instances (horizontal scaling)
// - For production with multiple instances, use Redis:
//   npm install rate-limit-redis ioredis
//
// Example Redis implementation:
// import RedisStore from 'rate-limit-redis';
// import Redis from 'ioredis';
// const redisClient = new Redis(process.env.REDIS_URL);

const isProduction = process.env.NODE_ENV === 'production';

// Warn about in-memory store in production
if (isProduction) {
  console.warn('⚠️ Rate limiter using in-memory store. For production with multiple instances, configure Redis.');
}

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter middleware
 * @param {Object} options - Rate limiter configuration
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.maxRequests - Maximum requests per window (default: 10)
 * @param {string} options.message - Error message when limit exceeded
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 10,
    message = 'Too many requests. Please try again later.',
  } = options;

  return (req, res, next) => {
    // Use user ID if authenticated, otherwise use IP
    const identifier = req.user?.id || req.ip || 'anonymous';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    let requestData = rateLimitStore.get(key);

    if (!requestData || now - requestData.windowStart > windowMs) {
      // New window
      requestData = {
        windowStart: now,
        windowMs,
        count: 1,
      };
      rateLimitStore.set(key, requestData);
    } else {
      requestData.count++;
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - requestData.count),
      'X-RateLimit-Reset': Math.ceil((requestData.windowStart + windowMs) / 1000),
    });

    if (requestData.count > maxRequests) {
      const retryAfter = Math.ceil((requestData.windowStart + windowMs - now) / 1000);
      res.set('Retry-After', retryAfter);
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter,
      });
    }

    next();
  };
}

// Pre-configured rate limiters for different use cases
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 AI generations per minute
  message: 'Příliš mnoho požadavků na AI. Počkejte prosím minutu.',
});

export const strategyGenerationLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 complete strategy generations per 5 minutes
  message: 'Generování strategie je omezeno. Počkejte prosím 5 minut.',
});
