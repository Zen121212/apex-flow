import pino from 'pino';

// Create logger with fallback configuration
let loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
};

// Try to use pino-pretty if available, but don't fail if it's not
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  try {
    // Check if pino-pretty is available
    require('pino-pretty');
    loggerConfig = {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    };
  } catch (error) {
    // pino-pretty not available, use default JSON format
    console.warn('pino-pretty not available, using JSON logging format');
  }
}

export const logger = pino(loggerConfig);

export default logger;
