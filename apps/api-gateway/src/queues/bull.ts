import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create Redis connection with retry logic
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
});

// Handle connection errors gracefully
connection.on('error', (error) => {
  console.warn('Redis connection error:', error.message);
});

connection.on('connect', () => {
  console.log('Redis connected successfully');
});

export const ingestQueue = new Queue('ingest', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export { connection };
