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
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('DATABASE', 'MongoDB disconnected');
});

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
