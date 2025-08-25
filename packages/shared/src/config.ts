import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  mongoUri: string;
  redisUrl: string;
  s3Endpoint: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Bucket: string;
  jwtSecret: string;
  openaiApiKey?: string;
  slackSigningSecret?: string;
  slackBotToken?: string;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minio',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minio123',
  s3Bucket: process.env.S3_BUCKET || 'apexflow-local',
  jwtSecret: process.env.JWT_SECRET || 'changeme-super-secure-jwt-secret',
  openaiApiKey: process.env.OPENAI_API_KEY,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  slackBotToken: process.env.SLACK_BOT_TOKEN,
};

export default config;
