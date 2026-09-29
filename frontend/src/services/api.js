import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
