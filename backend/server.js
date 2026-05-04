require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initSocket } = require('./src/services/socketService');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

initSocket(server);

server.on('error', (err) => {
  logger.error(`HTTP server error: ${err.message}`);
  process.exit(1);
});

const connectServicesInBackground = async () => {
  try {
    await connectDB();
  } catch (err) {
    logger.error(`MongoDB startup connection failed: ${err.message}`);
  }

  try {
    connectRedis();
  } catch (err) {
    logger.error(`Redis startup connection failed: ${err.message}`);
  }
};

const start = () => {
  server.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  connectServicesInBackground();
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

start();
