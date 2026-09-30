import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info('DATABASE', `MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error('DATABASE', `MongoDB connection failed: ${error.message}`, error);
    if (env.NODE_ENV === 'production') {
      logger.warn('DATABASE', 'Server remaining online for health checks; retrying database connection in 5s...');
      setTimeout(connectDB, 5000);
      return;
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('DATABASE', 'MongoDB disconnected');
});

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
