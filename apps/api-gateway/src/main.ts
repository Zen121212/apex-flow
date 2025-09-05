import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // Register cookie support
  await app.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-key',
  });

  // Register multipart support for file uploads
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3001', // Keep this for backwards compatibility
      'http://127.0.0.1:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (_req, reply) => {
    reply.send({ ok: true, service: 'api-gateway', timestamp: new Date().toISOString() });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (_req, reply) => {
    reply.send({
      message: 'ApexFlow API Gateway',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          profile: 'GET /auth/profile'
        },
        documents: {
          upload: 'POST /documents/upload',
          process: 'POST /documents/:id/process'
        },
        search: {
          query: 'POST /search/query'
        },
        integrations: {
          list: 'GET /integrations',
          create: 'POST /integrations',
          get: 'GET /integrations/:id',
          update: 'PUT /integrations/:id',
          delete: 'DELETE /integrations/:id',
          test: 'POST /integrations/:id/test',
          toggle: 'POST /integrations/:id/toggle'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  const port = process.env.API_GATEWAY_PORT ? Number(process.env.API_GATEWAY_PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway listening on port ${port}`);
}

bootstrap().catch(console.error);
