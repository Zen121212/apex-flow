import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
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

  // Enable validation pipes globally
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ApexFlow API')
    .setDescription(`
      # ApexFlow AI Document Processing Platform API
      
      This API provides comprehensive document processing, AI analysis, workflow automation, and integration capabilities.
      
      ## Features
      - 🔐 **Authentication**: JWT-based auth with register/login/logout
      - 📄 **Document Management**: Upload, process, and analyze documents
      - 🤖 **AI Analysis**: Advanced document analysis using AI models
      - ⚡ **Workflow Automation**: Create and manage document processing workflows
      - 🔗 **Integrations**: Slack, Email, Database, and Webhook integrations
      - 🔍 **Search**: Intelligent document search capabilities
      - 💬 **AI Chat**: Interactive document Q&A with AI assistant
      
      ## Getting Started
      1. **Register** a new account or **login** with existing credentials
      2. **Upload** documents for processing
      3. **Create workflows** to automate document processing
      4. **Configure integrations** for notifications and data export
      5. **Analyze documents** with AI-powered insights
      
      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your-jwt-token>
      \`\`\`
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('auth-cookie', {
      type: 'apiKey',
      in: 'cookie',
      name: 'auth-cookie',
    })
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.apexflow.com', 'Production server')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Documents', 'Document upload, processing, and management')
    .addTag('AI Analysis', 'AI-powered document analysis and insights')
    .addTag('Workflows', 'Workflow creation and management')
    .addTag('Integrations', 'Third-party integrations (Slack, Email, etc.)')
    .addTag('Search', 'Document search and discovery')
    .addTag('Chat', 'AI-powered document chat and Q&A')
    .addTag('Debug', 'Development and debugging endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ApexFlow API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

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
