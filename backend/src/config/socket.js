import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

let ioInstance = null;

/**
 * Initialize Socket.IO with HTTP server instance
 * @param {import('http').Server} httpServer
 * @returns {Server} Socket.IO server
 */
export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  ioInstance.on('connection', (socket) => {
    logger.info('SOCKET', `Client connected: ${socket.id}`);

    // Join specific research session room
    socket.on('session:join', ({ sessionId } = {}) => {
      if (sessionId) {
        const room = `session:${sessionId}`;
        socket.join(room);
        logger.info('SOCKET', `Socket ${socket.id} joined room ${room}`);
        socket.emit('session:joined', { sessionId, room });
      }
    });

    // Leave research session room
    socket.on('session:leave', ({ sessionId } = {}) => {
      if (sessionId) {
        const room = `session:${sessionId}`;
        socket.leave(room);
        logger.info('SOCKET', `Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('SOCKET', `Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  logger.info('SOCKET', 'Socket.IO real-time event server initialized');
  return ioInstance;
}

/**
 * Get the active Socket.IO server instance
 * @returns {Server|null}
 */
export function getIO() {
  return ioInstance;
}

/**
 * Emit an event to a specific research session room
 * @param {string} sessionId
 * @param {string} event
 * @param {Object} payload
 */
export function emitToSession(sessionId, event, payload = {}) {
  if (!ioInstance) {
    logger.debug('SOCKET', `Socket.IO not initialized. Suppressed event "${event}" for session ${sessionId}`);
    return;
  }

  const room = `session:${sessionId}`;
  const envelope = {
    sessionId,
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // Broadcast to session room as well as root namespace
  ioInstance.to(room).emit(event, envelope);
  ioInstance.emit(`session:${sessionId}:${event}`, envelope);
  logger.debug('SOCKET', `Emitted [${event}] to room ${room}`);
}
