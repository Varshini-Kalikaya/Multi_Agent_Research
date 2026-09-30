import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Strict authentication middleware: rejects requests without valid JWT
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid format',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token signature',
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account associated with this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('AUTH', `Authentication middleware error: ${error.message}`, error);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to authenticate user',
    });
  }
}

/**
 * Optional authentication middleware:
 * If a valid Bearer token is provided, attaches req.user.
 * If no token is provided or invalid, continues as guest without failing.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      req.user = user || null;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}
