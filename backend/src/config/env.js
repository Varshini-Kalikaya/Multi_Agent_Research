import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multi_agent_research',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  SEARCH_PROVIDER: process.env.SEARCH_PROVIDER || 'tavily',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  MAX_SUB_QUESTIONS: parseInt(process.env.MAX_SUB_QUESTIONS || '5', 10),
  MAX_SOURCES_PER_QUERY: parseInt(process.env.MAX_SOURCES_PER_QUERY || '5', 10),
  MAX_TOTAL_SOURCES: parseInt(process.env.MAX_TOTAL_SOURCES || '20', 10),
  MAX_CONCURRENT_LLM_CALLS: parseInt(process.env.MAX_CONCURRENT_LLM_CALLS || '3', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'multi_agent_research_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
