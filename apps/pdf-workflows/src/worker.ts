import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from './logger';
import { mongoDataSource } from './mongo';
import { processDocument } from './processor';
import { vectorStorage } from './vector-storage';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

const ingestQueue = new Queue('ingest', { connection });

// Worker to process document ingestion jobs
const worker = new Worker('ingest', async (job) => {
  logger.info('Processing job', { 
    jobId: job.id, 
    jobName: job.name, 
    data: job.data 
  });

  try {
    await processDocument(job.data);
    logger.info('Job completed successfully', { jobId: job.id });
  } catch (error) {
    logger.error('Job failed', { 
      jobId: job.id, 
      error: error.message 
    });
    throw error;
  }
}, { 
  connection,
  concurrency: 3,
});

// Queue events for monitoring
const queueEvents = new QueueEvents('ingest', { connection });

queueEvents.on('completed', ({ jobId }) => {
  logger.info('Ingest job completed', { jobId });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Ingest job failed', { jobId, failedReason });
});

// Initialize MongoDB connection and Vector Storage
Promise.all([
  mongoDataSource.initialize(),
  vectorStorage.initialize()
])
  .then(() => {
    logger.info('MongoDB and Vector Storage connected successfully');
  })
  .catch((error) => {
    logger.error('Database initialization failed', error);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

logger.info('🔄 PDF workflows worker started');

export { worker, ingestQueue };
