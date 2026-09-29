import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      logger.info('SERVER', `Multi-Agent Research Assistant backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info('SERVER', `Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      logger.info('SERVER', `Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('SERVER', 'HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('SERVER', `Failed to start server: ${error.message}`, error);
    process.exit(1);
  }
};

startServer();
