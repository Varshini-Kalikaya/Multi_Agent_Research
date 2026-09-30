import { env } from './env.js';

/**
 * Validates whether an incoming HTTP/WebSocket origin is permitted.
 * Supports:
 * - Exact user deployment: https://multi-agent-research-phi.vercel.app
 * - Render backend domain: https://multi-agent-research1.onrender.com
 * - Any *.vercel.app domain (production and preview deployments)
 * - Any *.onrender.com domain
 * - Local development: localhost:5173, localhost:3000, 127.0.0.1
 * - Custom origins defined via CLIENT_URL or CORS_ORIGIN
 * - No-origin requests (curl, server-to-server, mobile)
 *
 * @param {string|undefined} origin
 * @returns {boolean}
 */
export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (curl, mobile, Postman, server-to-server)
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/$/, '');

  // Known allowed production & dev endpoints
  const allowedExact = [
    'https://multi-agent-research-phi.vercel.app',
    'https://multi-agent-research1.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  if (allowedExact.includes(normalized)) return true;

  // Wildcard match for all Vercel deployments (production + preview PR branches)
  if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  // Wildcard match for Render subdomains
  if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(normalized)) {
    return true;
  }

  // Allow configured env variables
  const configured = [
    env.CLIENT_URL,
    ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : []),
  ]
    .filter(Boolean)
    .map((u) => u.trim().replace(/\/$/, ''));

  if (configured.includes('*') || configured.includes(normalized)) {
    return true;
  }

  if (env.NODE_ENV === 'development') {
    return true;
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Authorization'],
};
