import Fastify from 'fastify';
import pino from 'pino';
import { performRAGQuery, summarizeDocument, generateEmbedding } from './retrieval';
import { vectorClient } from './vector-client';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const server = Fastify({
  logger,
});

// Query endpoint (redirects to Visual AI service)
server.post('/qa', async (request, reply) => {
  const { query, context = {} } = request.body as { 
    query: string; 
    context?: Record<string, any>; 
  };

  if (!query) {
    return reply.status(400).send({ error: 'Query is required' });
  }

  try {
    // Note: This service focuses on workflow orchestration
    // For document Q&A, use the Visual AI service on the API Gateway
    
    const result = await performRAGQuery(query, context);
    
    return reply.send({
      query,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence,
      redirect: 'Use /ai/visual-analysis on API Gateway (port 3000) for document analysis',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Query processing failed', { error: error.message, query });
    
    return reply.status(500).send({
      error: 'Failed to process query',
      message: error.message,
      redirect: 'Use /ai/visual-analysis on API Gateway (port 3000) for document analysis',
    });
  }
});

// Document summarization endpoint (basic implementation)
server.post('/summarize', async (request, reply) => {
  const { text, maxLength = 150 } = request.body as {
    text: string;
    maxLength?: number;
  };

  if (!text) {
    return reply.status(400).send({ error: 'Text is required' });
  }

  try {
    const summary = await summarizeDocument(text, maxLength);
    
    return reply.send({
      originalLength: text.length,
      summaryLength: summary.length,
      summary,
      note: 'For advanced summarization, use the Visual AI service on API Gateway (port 3000)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Summarization failed', { error: error.message });
    
    return reply.status(500).send({
      error: 'Failed to summarize document',
      message: error.message,
      redirect: 'Use /ai/visual-analysis on API Gateway (port 3000) for advanced summarization',
    });
  }
});

// Generate embeddings endpoint (placeholder implementation)
server.post('/embeddings', async (request, reply) => {
  const { text } = request.body as { text: string };

  if (!text) {
    return reply.status(400).send({ error: 'Text is required' });
  }

  try {
    const embedding = await generateEmbedding(text);
    
    return reply.send({
      text,
      embedding,
      dimensions: embedding.length,
      note: 'This is a placeholder embedding. For real embeddings, use the Visual AI service on API Gateway (port 3000)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Embedding generation failed', { error: error.message });
    
    return reply.status(500).send({
      error: 'Failed to generate embedding',
      message: error.message,
      redirect: 'Use /ai/visual-analysis on API Gateway (port 3000) for real embeddings',
    });
  }
});

// Invoice data extraction endpoint (deprecated)
server.post('/extract-invoice', async (request, reply) => {
  const { pdfText, filename } = request.body as { 
    pdfText: string; 
    filename?: string;
  };

  if (!pdfText) {
    return reply.status(400).send({ error: 'PDF text content is required' });
  }

  logger.warn('Invoice extraction endpoint is deprecated. Use Visual AI service directly.');
  
  return reply.status(501).send({
    error: 'Invoice extraction has been migrated to Visual AI service',
    message: 'This endpoint is deprecated. Use the api-gateway debug endpoints with Visual AI instead.',
    filename: filename || 'unknown',
    redirect: '/debug/extract-invoice-data'
  });
});

// AI service health check (redirects to Visual AI)
server.get('/ai-health', async (_request, reply) => {
  return reply.send({
    status: 'redirect',
    message: 'AI services are handled by Visual AI. Use API Gateway endpoints instead.',
    redirect: 'Use /ai/health on API Gateway (port 3000) for Visual AI health check'
  });
});

// Vector storage health check
server.get('/vector-health', async (_request, reply) => {
  try {
    const health = await vectorClient.healthCheck();
    return reply.send(health);
  } catch (error) {
    return reply.status(500).send({
      status: 'error',
      message: error.message,
    });
  }
});

// Health check
server.get('/health', async (_request, reply) => {
  return reply.send({ 
    ok: true, 
    service: 'agent-orchestrator',
    purpose: 'Workflow orchestration and Visual AI integration',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const start = async () => {
  try {
    // Initialize vector client connection
    await vectorClient.initialize();
    console.log('🔗 Vector client initialized');
    
    const port = process.env.AGENT_ORCHESTRATOR_PORT ? 
      Number(process.env.AGENT_ORCHESTRATOR_PORT) : 3002;
    
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🤖 Agent orchestrator listening on port ${port} (Workflow orchestration & Visual AI integration)`);
    
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
