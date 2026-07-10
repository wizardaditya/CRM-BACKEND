const { verifyAccessToken } = require('../config/jwt');
const logger = require('../utils/logger');

// Map userId → Set of socket IDs (one user may have multiple tabs)
const onlineUsers = new Map();

/**
 * Register Socket.io handlers
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Track online users
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    // Join personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(socket.userId);
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Client can join a lead room to get real-time updates on that lead
    socket.on('join:lead', (leadId) => {
      socket.join(`lead:${leadId}`);
    });

    socket.on('leave:lead', (leadId) => {
      socket.leave(`lead:${leadId}`);
    });
  });
};

/**
 * Emit a notification to a specific user
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit a lead update to all subscribers of that lead
 */
const emitLeadUpdate = (io, leadId, data) => {
  io.to(`lead:${leadId}`).emit('lead:updated', data);
};

module.exports = { initSocket, emitToUser, emitLeadUpdate, onlineUsers };
