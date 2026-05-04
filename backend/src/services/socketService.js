const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email avatar');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.name} (${userId})`);

    socket.join(`user:${userId}`);

    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      logger.debug(`${socket.user.name} joined project room: ${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('user:online', () => {
      socket.to(`user:${userId}`).emit('user:status', { userId, status: 'online' });
    });

    socket.on('task:typing', ({ taskId, projectId }) => {
      socket.to(`project:${projectId}`).emit('task:typing', {
        taskId,
        user: { id: userId, name: socket.user.name },
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

const getSocketIO = () => io;

module.exports = { initSocket, getSocketIO };
