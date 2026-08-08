const Redis = require('ioredis');

let redisClient;
let isRedisEnabled = false;

const localCache = new Map();

try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection failed. Falling back to in-memory cache.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
    isRedisEnabled = true;
  });

  redisClient.on('error', (err) => {
    console.warn(`[Redis] Error occurred: ${err.message}. Using in-memory cache.`);
    isRedisEnabled = false;
  });
} catch (e) {
  console.warn('[Redis] Connection initialization failed. Using in-memory cache.');
}

const cacheService = {
  async get(key) {
    if (isRedisEnabled && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        return localCache.get(key) || null;
      }
    }
    return localCache.get(key) || null;
  },

  async set(key, value, expirySeconds = 300) {
    if (isRedisEnabled && redisClient) {
      try {
        if (expirySeconds) {
          await redisClient.set(key, value, 'EX', expirySeconds);
        } else {
          await redisClient.set(key, value);
        }
        return;
      } catch (err) {
        // Fallback
      }
    }
    localCache.set(key, value);
    if (expirySeconds) {
      setTimeout(() => {
        localCache.delete(key);
      }, expirySeconds * 1000);
    }
  },

  async del(key) {
    if (isRedisEnabled && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        // Fallback
      }
    }
    localCache.delete(key);
  }
};

module.exports = cacheService;
