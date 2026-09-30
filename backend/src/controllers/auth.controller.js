import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const authController = {
  /**
   * Register a new user account
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'ValidationError', message: 'Name is required' });
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'ValidationError', message: 'Valid email address is required' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Password must be at least 6 characters long',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          error: 'ConflictError',
          message: 'An account with this email address already exists',
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      logger.info('AUTH', `New user registered: ${user.email} (${user._id})`);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      logger.error('AUTH', `Registration error: ${error.message}`, error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Registration failed due to a server error',
      });
    }
  },

  /**
   * Login user with email & password
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Both email and password are required',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || !user.passwordHash) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      logger.info('AUTH', `User logged in: ${user.email} (${user._id})`);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      logger.error('AUTH', `Login error: ${error.message}`, error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Login failed due to a server error',
      });
    }
  },

  /**
   * Get current authenticated user profile
   * GET /api/auth/me
   */
  async me(req, res) {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  },
};
