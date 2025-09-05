// Application constants for ApexFlow

// File upload settings
export const UPLOAD_SETTINGS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.docx', '.doc'],
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 260,
  HEADER_HEIGHT: 64,
  DEFAULT_PAGE_SIZE: 20,
  ANIMATION_DURATION: 200,
} as const;

// Workflow constants
export const WORKFLOW_CONSTANTS = {
  MAX_WORKFLOW_NAME_LENGTH: 50,
  MAX_WORKFLOW_DESCRIPTION_LENGTH: 200,
  DEFAULT_WORKFLOW_STATUS: 'active',
} as const;

// Document processing constants
export const PROCESSING_CONSTANTS = {
  EMBEDDING_DIMENSIONS: 384,
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 50,
  DEFAULT_SUMMARY_LENGTH: 150,
} as const;

// Theme colors
export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  GRAY: '#6b7280',
} as const;

export default {
  UPLOAD_SETTINGS,
  UI_CONSTANTS,
  WORKFLOW_CONSTANTS,
  PROCESSING_CONSTANTS,
  COLORS,
};
