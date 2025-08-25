import Fastify from 'fastify';
import pino from 'pino';
import { performRAGQuery } from './retrieval';

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
