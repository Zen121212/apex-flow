import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

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
        documents: {
          upload: 'POST /documents/upload',
          process: 'POST /documents/:id/process'
        },
        search: {
          query: 'POST /search/query'
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
