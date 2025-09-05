# ApexFlow End-to-End Workflow Guide

## 🚀 Complete Document Processing & AI Question Answering System

This guide demonstrates how to upload documents, process them with Hugging Face AI models, and perform intelligent question answering using the complete ApexFlow system.

## 📋 Prerequisites

### 1. Environment Setup
```bash
# Copy environment file
cp .env.example .env
```

### 2. Required Environment Variables
```bash
# .env file
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
MONGO_URI=mongodb://localhost:27017/apexflow
REDIS_URL=redis://localhost:6379
AGENT_ORCHESTRATOR_PORT=3002
API_GATEWAY_PORT=3000
```

### 3. Start Required Services
```bash
# Start MongoDB (if using Docker)
docker run -d --name apexflow-mongo -p 27017:27017 mongo:latest

# Start Redis (if using Docker)  
docker run -d --name apexflow-redis -p 6379:6379 redis:alpine

# Or use local installations
# brew install mongodb-community redis (macOS)
```

### 4. Install Dependencies
```bash
# Root level
npm install

# Individual services
cd apps/agent-orchestrator && npm install
cd ../api-gateway && npm install
cd ../pdf-workflows && npm install
```

## 🎯 Step-by-Step Workflow

### Step 1: Start All Services

#### Terminal 1 - Agent Orchestrator (Hugging Face AI Service)
```bash
cd apps/agent-orchestrator
npm run start:dev
```
**Expected output:**
```
🔗 Vector client initialized
🤖 Loading Hugging Face models...
✅ Hugging Face models loaded successfully
🤖 Agent orchestrator listening on port 3002
```

#### Terminal 2 - PDF Workflows Worker
```bash
cd apps/pdf-workflows
npm run start:dev
```
**Expected output:**
```
MongoDB and Vector Storage connected successfully
🔄 PDF workflows worker started
```

#### Terminal 3 - API Gateway
```bash
cd apps/api-gateway
npm run start:dev
```
**Expected output:**
```
🚀 API Gateway listening on port 3000
```

### Step 2: Health Checks

Verify all services are running:

```bash
# API Gateway
curl http://localhost:3000/health

# Agent Orchestrator
curl http://localhost:3002/health

# Hugging Face Models
curl http://localhost:3002/hf-health

# Vector Storage
curl http://localhost:3002/vector-health
```

### Step 3: Create Test User (if authentication is required)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@apexflow.ai",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

Get login token:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@apexflow.ai",
    "password": "testpassword123"
  }'
```

Save the returned token for subsequent requests.

### Step 4: Upload a Document

#### Option A: File Upload (Multipart)
```bash
# Create a test PDF or text file
echo "This is a sample document about ApexFlow.

ApexFlow is an AI-powered document processing platform that uses Hugging Face models for text extraction, chunking, and intelligent question answering.

The system can process PDFs, extract text, generate embeddings, and provide accurate answers to questions about the document content.

Features include:
- PDF text extraction
- Smart text chunking
- Vector embeddings with Hugging Face
- Semantic search and retrieval
- AI-powered question answering

ApexFlow is built with microservices architecture including API Gateway, Document Processing Workers, and AI Agent Orchestrator." > sample_document.txt

# Upload document
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sample_document.txt" \
  -F "autoProcess=true"
```

#### Option B: Simple Upload (JSON)
```bash
curl -X POST http://localhost:3000/documents/simple-upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "originalName": "sample_document.txt",
    "mimeType": "text/plain",
    "size": 1024,
    "content": "This is a sample document about ApexFlow. ApexFlow is an AI-powered document processing platform that uses Hugging Face models for text extraction, chunking, and intelligent question answering. The system can process PDFs, extract text, generate embeddings, and provide accurate answers to questions about the document content."
  }'
```

**Expected Response:**
```json
{
  "documentId": "64f7a1b2c3d4e5f6g7h8i9j0",
  "filename": "sample_document.txt",
  "size": 1024,
  "mimeType": "text/plain",
  "processingJobId": "bull_1234567890_process-document",
  "message": "Document uploaded and queued for processing"
}
```

### Step 5: Monitor Document Processing

Check document list:
```bash
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Get specific document:
```bash
curl -X GET http://localhost:3000/documents/YOUR_DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 6: Wait for Processing to Complete

Processing typically takes 30-60 seconds depending on document size. Monitor logs in the pdf-workflows terminal for:

```
✅ Document processing completed successfully
📊 Generated embedding with 384 dimensions
📚 Stored document chunks: 5 chunks, 5 embeddings
```

### Step 7: Ask Questions About Your Document

Once processing is complete, you can ask questions:

```bash
# Ask a specific question
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is ApexFlow?"
  }'
```

**Expected Response:**
```json
{
  "query": "What is ApexFlow?",
  "answer": "ApexFlow is an AI-powered document processing platform that uses Hugging Face models for text extraction, chunking, and intelligent question answering.",
  "citations": [
    {
      "documentId": "64f7a1b2c3d4e5f6g7h8i9j0",
      "title": "Document 64f7a1b2c3d4e5f6g7h8i9j0",
      "excerpt": "ApexFlow is an AI-powered document processing platform that uses Hugging Face models...",
      "score": 0.95,
      "pageNumber": null
    }
  ],
  "confidence": 0.89,
  "timestamp": "2025-01-02T20:30:45.123Z"
}
```

### Step 8: More Advanced Queries

```bash
# Complex question
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main features of ApexFlow?"
  }'

# Technical question
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What architecture does ApexFlow use?"
  }'

# Summarize content
curl -X POST http://localhost:3002/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long document text here...",
    "maxLength": 150
  }'
```

## 📊 Testing Different File Types

### PDF Upload
```bash
# Assuming you have a PDF file
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "autoProcess=true"
```

### Word Document (if supported)
```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.docx" \
  -F "autoProcess=true"
```

## 🔍 Debugging & Troubleshooting

### Check Service Health
```bash
# Comprehensive health check
curl http://localhost:3002/hf-health && echo
curl http://localhost:3002/vector-health && echo
curl http://localhost:3000/health && echo
```

### View Processing Logs
Monitor the terminal windows for each service:

1. **Agent Orchestrator**: Hugging Face model loading, embedding generation
2. **PDF Workflows**: Document processing, text extraction, chunking
3. **API Gateway**: Upload handling, job queuing

### Common Issues & Solutions

#### 1. "Models not loading"
```bash
# Check Hugging Face API key
curl http://localhost:3002/hf-health
```
**Solution**: Ensure `HUGGINGFACE_API_KEY` is set in .env

#### 2. "Vector search returning no results"
```bash
# Check vector storage
curl http://localhost:3002/vector-health
```
**Solution**: Wait for document processing to complete

#### 3. "MongoDB connection failed"
```bash
# Test MongoDB connection
docker ps | grep mongo
```
**Solution**: Start MongoDB service

#### 4. "Redis connection failed"
```bash
# Test Redis connection  
docker ps | grep redis
```
**Solution**: Start Redis service

## 📈 Performance Monitoring

### Embedding Generation Stats
```bash
curl -X POST http://localhost:3002/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "test embedding generation"}'
```

### Vector Search Performance
```bash
# The QA endpoint shows search performance in logs
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{"query": "performance test"}'
```

## 🎯 Success Criteria

Your ApexFlow system is working correctly if:

✅ All services start without errors  
✅ Health checks return "healthy" status  
✅ Documents upload successfully  
✅ Processing completes with embeddings generated  
✅ Questions return relevant answers with citations  
✅ Vector search finds similar content  
✅ Confidence scores are reasonable (>0.5 for good matches)  

## 🚀 Next Steps

1. **Scale Up**: Add more worker processes for pdf-workflows
2. **Production**: Configure MongoDB Atlas with vector search
3. **Monitoring**: Add APM tools like DataDog or New Relic
4. **UI**: Build a React frontend for document management
5. **Advanced Models**: Experiment with other Hugging Face models
6. **Caching**: Add Redis caching for frequent queries

## 📝 API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/documents/upload` | POST | Upload files |
| `/documents/simple-upload` | POST | Upload via JSON |
| `/documents` | GET | List documents |
| `/documents/:id` | GET | Get document details |
| `/qa` | POST | Ask questions |
| `/summarize` | POST | Summarize text |
| `/embeddings` | POST | Generate embeddings |
| `/health` | GET | Service health |
| `/hf-health` | GET | AI models health |
| `/vector-health` | GET | Vector storage health |

Congratulations! You now have a fully functional AI-powered document processing system with Hugging Face integration! 🎉
