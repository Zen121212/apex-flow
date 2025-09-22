#!/usr/bin/env node

/**
 * Sample CI Webhook Endpoint
 * This is an example Node.js server that can receive CI status updates
 * Deploy this to your own server or serverless function to receive CI notifications
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3333;

// Sample webhook handler
function handleCIWebhook(payload) {
  console.log('=== CI Webhook Received ===');
  console.log('Event:', payload.event);
  console.log('Status:', payload.status);
  console.log('Repository:', payload.repository);
  console.log('Branch:', payload.branch);
  console.log('Commit:', payload.commit.sha);
  console.log('Author:', payload.commit.author);
  console.log('Message:', payload.commit.message);
  console.log('Build URL:', payload.build.url);
  console.log('Test Status:', payload.tests.status);
  console.log('Security Status:', payload.security.status);
  console.log('================================');

  // Example: Forward to another service
  if (process.env.FORWARD_URL) {
    const data = JSON.stringify(payload);
    const url = new URL(process.env.FORWARD_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': process.env.FORWARD_TOKEN ? `Bearer ${process.env.FORWARD_TOKEN}` : undefined
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      console.log(`Forward response: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.error('Forward error:', error.message);
    });

    req.write(data);
    req.end();
  }

  // Example: Save to database (implement your own logic)
  // saveToDatabase(payload);
  
  // Example: Send to monitoring system
  // sendToMonitoring(payload);
  
  // Example: Update dashboard
  // updateDashboard(payload);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (req.url !== '/webhook/ci') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      
      // Validate webhook (implement your own auth logic)
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.WEBHOOK_SECRET;
      
      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      
      handleCIWebhook(payload);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'CI webhook processed successfully' 
      }));
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    }
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'ci-webhook',
      timestamp: new Date().toISOString() 
    }));
  }
});

server.listen(PORT, () => {
  console.log(`CI Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/ci`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Environment variables:');
  console.log('- WEBHOOK_SECRET: Set to validate incoming webhooks');
  console.log('- FORWARD_URL: Set to forward webhooks to another service');
  console.log('- FORWARD_TOKEN: Set authentication token for forwarding');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});