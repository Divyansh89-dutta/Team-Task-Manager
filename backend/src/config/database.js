const mongoose = require('mongoose');
const logger = require('../utils/logger');
let connectionPromise = null;

const getUriDiagnostics = (rawUri) => {
  if (!rawUri) {
    return { present: false };
  }

  const uri = String(rawUri);
  const trimmed = uri.trim();

  return {
    present: true,
    length: uri.length,
    trimmedLength: trimmed.length,
    startsWithMongo: trimmed.startsWith('mongodb://') || trimmed.startsWith('mongodb+srv://'),
    firstChars: JSON.stringify(trimmed.slice(0, 20)),
    hasLeadingOrTrailingWhitespace: uri !== trimmed,
  };
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const dbUri = process.env.MONGODB_URI;
  const dbUriTrimmed = dbUri ? dbUri.trim() : dbUri;
  const uriDiagnostics = getUriDiagnostics(dbUri);

  // Log environment status for debugging
  logger.info(`Environment check - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  logger.info(`Environment check - MONGODB_URI: ${dbUri ? 'set' : 'missing'}`);
  logger.info(`Environment check - JWT_SECRET: ${process.env.JWT_SECRET ? 'set' : 'missing'}`);
  logger.info(`Environment check - MONGODB_URI diagnostics: ${JSON.stringify(uriDiagnostics)}`);

  if (!dbUriTrimmed) {
    logger.error('Missing required environment variable: MONGODB_URI');
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  if (!process.env.JWT_SECRET) {
    logger.error('Missing required environment variable: JWT_SECRET');
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  try {
    connectionPromise = mongoose.connect(dbUriTrimmed, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    const conn = await connectionPromise;

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnect...');
    });

    connectionPromise = null;
    return conn.connection;
  } catch (error) {
    connectionPromise = null;
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = connectDB;
