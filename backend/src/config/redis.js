const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => {
      logger.warn('Redis error (using fallback):', err.message);
    });

    redisClient.connect().catch(() => {
      logger.warn('Redis unavailable - caching disabled');
    });

  } catch (err) {
    logger.warn('Redis init failed:', err.message);
  }

  return redisClient;
};

const getRedis = () => redisClient;

module.exports = { connectRedis, getRedis };
