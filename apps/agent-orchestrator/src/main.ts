import Fastify from 'fastify';
import pino from 'pino';
import { performRAGQuery, summarizeDocument, generateEmbedding } from './retrieval';
import { huggingFaceService } from './huggingface-service';
import { vectorClient } from './vector-client';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const server = Fastify({
  logger,
});

// Question-answering endpoint
server.post('/qa', async (request, reply) => {
  const { query, context = {} } = request.body as { 
    query: string; 
    context?: Record<string, any>; 
  };

  if (!query) {
    return reply.status(400).send({ error: 'Query is required' });
  }

  try {
    // TODO: Implement actual RAG pipeline
    // 1. Retrieve relevant documents using vector search
    // 2. Generate response using LLM with retrieved context
    // 3. Format response with citations
    
    const result = await performRAGQuery(query, context);
    
    return reply.send({
      query,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('QA query failed', { error: error.message, query });
    
    return reply.status(500).send({
      error: 'Failed to process query',
      message: error.message,
    });
  }
});

// Document summarization endpoint
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Summarization failed', { error: error.message });
    
    return reply.status(500).send({
      error: 'Failed to summarize document',
      message: error.message,
    });
  }
});

// Generate embeddings endpoint
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Embedding generation failed', { error: error.message });
    
    return reply.status(500).send({
      error: 'Failed to generate embedding',
      message: error.message,
    });
  }
});

// Hugging Face health check
server.get('/hf-health', async (_request, reply) => {
  try {
    const health = await huggingFaceService.healthCheck();
    return reply.send(health);
  } catch (error) {
    return reply.status(500).send({
      status: 'error',
      message: error.message,
    });
  }
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
    console.log(`🤖 Agent orchestrator listening on port ${port}`);
    
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
