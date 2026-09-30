import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { corsOptions } from './config/cors.js';

import authRoutes from './routes/auth.routes.js';
import researchRoutes from './routes/research.routes.js';

const app = express();

// Security middleware with cross-origin access enabled for modern web deployments
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// Unified CORS configuration supporting Vercel, Render, and Localhost
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint (Phase 1 requirement)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Authentication endpoints
app.use('/api/auth', authRoutes);

// Research API endpoints (Phase 2 requirement)
app.use('/api/research', researchRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  logger.error('SERVER', `Unhandled error: ${err.message}`, err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
  });
});

export default app;
