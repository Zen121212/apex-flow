// Environment configuration for ApexFlow React app

// API Base URL - defaults to API Gateway port
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Agent Orchestrator URL - for direct AI calls
export const AGENT_ORCHESTRATOR_URL = import.meta.env.VITE_AGENT_ORCHESTRATOR_URL || 'http://localhost:3002';

// Application settings
export const APP_NAME = 'ApexFlow';
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  AI_PROCESSING: true,
  WORKFLOWS: true,
  DOCUMENT_UPLOAD: true,
  VECTOR_SEARCH: true,
} as const;

// Development settings
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_PROFILE: '/auth/profile',
  
  // Documents
  DOCUMENTS: '/documents',
  DOCUMENTS_UPLOAD: '/documents/upload',
  DOCUMENTS_SIMPLE_UPLOAD: '/documents/simple-upload',
  
  // Workflows
  WORKFLOWS: '/workflows',
  WORKFLOWS_OPTIONS: '/workflows/config/options',
  
  // Integrations
  INTEGRATIONS: '/integrations',
  
  // Search
  SEARCH_QUERY: '/search/query',
  
  // Health checks
  HEALTH: '/health',
} as const;

// Agent Orchestrator endpoints
export const AI_ENDPOINTS = {
  QA: '/qa',
  SUMMARIZE: '/summarize',
  EMBEDDINGS: '/embeddings',
  HF_HEALTH: '/hf-health',
  VECTOR_HEALTH: '/vector-health',
} as const;

export default {
  API_BASE_URL,
  AGENT_ORCHESTRATOR_URL,
  APP_NAME,
  APP_VERSION,
  FEATURES,
  isDevelopment,
  isProduction,
  API_ENDPOINTS,
  AI_ENDPOINTS,
};
