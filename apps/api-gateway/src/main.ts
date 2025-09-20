import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');

async function bootstrap() {
  // Create NestJS application with Express platform (default)
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    abortOnError: false
  });

  // Enable CORS with permissive development configuration
  app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
  }));

  // Enable cookie parsing
  app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret-key'));

  // Configure express for large file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Health check endpoint
  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      service: 'api-gateway', 
      timestamp: new Date().toISOString(),
      platform: 'express'
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      message: 'ApexFlow API Gateway',
      version: '1.0.0',
      platform: 'Express + NestJS',
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
        },
        debug: {
          categorization: 'POST /debug/analyze-categorization',
          workflow: 'POST /debug/analyze-workflow-selection',
          pdfText: 'POST /debug/extract-pdf-text',
          invoiceData: 'POST /debug/extract-invoice-data',
          options: 'GET /debug/workflow-options'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  const port = process.env.API_GATEWAY_PORT ? Number(process.env.API_GATEWAY_PORT) : 3000;
  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway listening on port ${port} (Express + NestJS)`);
}

bootstrap().catch(console.error);
