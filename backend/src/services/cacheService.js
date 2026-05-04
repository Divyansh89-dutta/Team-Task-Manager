const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

const isAvailable = () => {
  const client = getRedis();
  return client && client.status === 'ready';
};

const get = async (key) => {
  if (!isAvailable()) return null;
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn(`Cache get error [${key}]:`, err.message);
    return null;
  }
};

const set = async (key, value, ttlSeconds = 300) => {
  if (!isAvailable()) return false;
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.warn(`Cache set error [${key}]:`, err.message);
    return false;
  }
};

const invalidate = async (key) => {
  if (!isAvailable()) return false;
  try {
    await getRedis().del(key);
    return true;
  } catch (err) {
    logger.warn(`Cache invalidate error [${key}]:`, err.message);
    return false;
  }
};

const invalidatePattern = async (pattern) => {
  if (!isAvailable()) return false;
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) {
      await getRedis().del(...keys);
    }
    return true;
  } catch (err) {
    logger.warn(`Cache pattern invalidate error [${pattern}]:`, err.message);
    return false;
  }
};

module.exports = { get, set, invalidate, invalidatePattern };
