import axios from 'axios';

/**
 * Determine API baseURL:
 * - In production (Render): uses VITE_API_URL (e.g. 'https://multi-agent-research-backend.onrender.com')
 *   and ensures '/api' is appended.
 * - In local dev (or if unset): falls back to '/api' which Vite proxies to localhost:5000.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // If running on Vercel or remote host, default to the deployed Render backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://multi-agent-research1.onrender.com/api';
  }

  // Local development fallback to Vite proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT Bearer token attachment
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthAPI = {
  async register({ name, email, password }) {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const HelperAPI = {
  async chat({ message, history = [], conversationId = null }) {
    const res = await api.post('/helper/chat', { message, history, conversationId });
    return res.data;
  },
};

export const ResearchAPI = {
  // Session management
  async createSession(topic) {
    const res = await api.post('/research', { topic });
    return res.data;
  },

  async getSession(sessionId) {
    const res = await api.get(`/research/${sessionId}`);
    return res.data;
  },

  async listSessions(page = 1, limit = 20) {
    const res = await api.get('/research', { params: { page, limit } });
    return res.data;
  },

  async deleteSession(sessionId) {
    const res = await api.delete(`/research/${sessionId}`);
    return res.data;
  },

  // Pipeline phases
  async executePipeline(sessionId) {
    const res = await api.post(`/research/${sessionId}/execute`);
    return res.data;
  },

  async plan(sessionId) {
    const res = await api.post(`/research/${sessionId}/plan`);
    return res.data;
  },

  async search(sessionId) {
    const res = await api.post(`/research/${sessionId}/search`);
    return res.data;
  },

  async summarize(sessionId) {
    const res = await api.post(`/research/${sessionId}/summarize`);
    return res.data;
  },

  async factCheck(sessionId) {
    const res = await api.post(`/research/${sessionId}/fact-check`);
    return res.data;
  },

  async writeReport(sessionId) {
    const res = await api.post(`/research/${sessionId}/write`);
    return res.data;
  },

  async validateCitations(sessionId) {
    const res = await api.post(`/research/${sessionId}/validate-citations`);
    return res.data;
  },

  // Output retrieval
  async getSources(sessionId) {
    const res = await api.get(`/research/${sessionId}/sources`);
    return res.data;
  },

  async getReport(sessionId) {
    const res = await api.get(`/research/${sessionId}/report`);
    return res.data;
  },

  async getHealth() {
    const res = await api.get('/health');
    return res.data;
  },
};
