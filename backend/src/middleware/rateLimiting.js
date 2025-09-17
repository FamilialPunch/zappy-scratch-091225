import rateLimit from 'express-rate-limit';
import { getRedis } from '../config/redis.js';

// Create store for Redis or use memory store as fallback
const createStore = () => {
  const redis = getRedis();
  
  if (redis) {
    // Use Redis store if available
    return {
      incr: async (key) => {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, 900); // 15 minutes
        }
        return { current, resetTime: new Date(Date.now() + 900 * 1000) };
      },
      decrement: async (key) => {
        await redis.decr(key);
      },
      resetKey: async (key) => {
        await redis.del(key);
      }
    };
  }
  
  // Fallback to memory store
  const hits = new Map();
  const resetTimes = new Map();
  
  return {
    incr: async (key) => {
      const now = Date.now();
      const resetTime = resetTimes.get(key) || now + 900000; // 15 minutes
      
      if (now > resetTime) {
        hits.set(key, 1);
        resetTimes.set(key, now + 900000);
        return { current: 1, resetTime: new Date(now + 900000) };
      }
      
      const current = (hits.get(key) || 0) + 1;
      hits.set(key, current);
      return { current, resetTime: new Date(resetTime) };
    },
    decrement: async (key) => {
      const current = hits.get(key) || 0;
      hits.set(key, Math.max(0, current - 1));
    },
    resetKey: async (key) => {
      hits.delete(key);
      resetTimes.delete(key);
    }
  };
};

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More lenient in development
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting in development for certain paths
    if (process.env.NODE_ENV === 'development') {
      const exemptPaths = ['/api/patients/me/consultations', '/api/patients/me', '/api/patients/me/programs'];
      return exemptPaths.some(path => req.path.includes(path));
    }
    return false;
  }
});

// Strict limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 requests per windowMs
  message: {
    error: 'Rate limit exceeded for sensitive operations',
    message: 'Please try again later'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit file uploads
  message: {
    error: 'File upload limit exceeded',
    message: 'Please try again later'
  }
});
