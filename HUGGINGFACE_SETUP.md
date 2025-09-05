# ApexFlow Hugging Face Integration

## 🤖 Selected Models

### **Primary Models for ApexFlow:**

1. **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`
   - **Use**: Vector search, RAG retrieval
   - **Dimensions**: 384
   - **Speed**: Fast, lightweight
   - **Quality**: High for document similarity

2. **Question Answering**: `deepset/roberta-base-squad2`
   - **Use**: Answering questions from documents
   - **Strength**: Excellent context understanding
   - **Training**: SQuAD 2.0 dataset

3. **Summarization**: `facebook/bart-large-cnn`
   - **Use**: Document summarization
   - **Strength**: News article summarization
   - **Quality**: High coherence

4. **Text Generation**: `microsoft/DialoGPT-medium`
   - **Use**: Conversational responses
   - **Fallback**: GPT-2 for simpler tasks

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/agent-orchestrator
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env and add your HUGGINGFACE_API_KEY
```

### 3. Get Hugging Face API Key
- Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Create a new token with "Read" permissions
- Add it to your `.env` file

### 4. Start the Service
```bash
npm run start:dev
```

## 📡 API Endpoints

### Question Answering
```bash
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'
```

### Document Summarization
```bash
curl -X POST http://localhost:3002/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your long document text here...", "maxLength": 150}'
```

### Generate Embeddings
```bash
curl -X POST http://localhost:3002/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "Text to embed"}'
```

### Health Check
```bash
curl http://localhost:3002/hf-health
```

## ⚡ Performance Optimizations

### Local vs API Models
- **Local pipelines**: No API calls, faster for repeated use
- **API calls**: Fallback when local models fail to load
- **First load**: Models download automatically (may take 1-2 minutes)

### Model Size Trade-offs
- **Current setup**: Balanced performance and speed
- **For higher quality**: Use `facebook/bart-large` instead of `bart-large-cnn`
- **For speed**: Use `distilbert-base-cased-distilled-squad` for Q&A

## 🔧 Customization

### Changing Models
Edit `src/huggingface-service.ts`:

```typescript
// For better document understanding
this.embeddingPipeline = await pipeline(
  'feature-extraction',
  'microsoft/mpnet-base'  // Higher quality embeddings
);

// For multilingual support
this.qaPipeline = await pipeline(
  'question-answering',
  'deepset/xlm-roberta-large-squad2'
);
```

### Environment Configuration
```bash
# Optional model overrides
HF_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
HF_QA_MODEL=deepset/roberta-large-squad2
HF_SUMMARIZATION_MODEL=facebook/bart-large
HF_GENERATION_MODEL=microsoft/DialoGPT-large
```

## 🎯 Next Steps for Production

1. **Vector Database**: Implement MongoDB Atlas vector search
2. **Caching**: Add Redis for embedding cache
3. **Rate Limiting**: Implement API rate limits
4. **Monitoring**: Add model performance metrics
5. **Scaling**: Consider model serving with TensorFlow Serving

## 🔍 Troubleshooting

### Common Issues

**Models not loading:**
- Check internet connection
- Verify Hugging Face API key
- Models download on first use (be patient)

**Memory issues:**
- Reduce to smaller models (e.g., `distilbert`)
- Use API-only mode by removing local pipelines

**API rate limits:**
- Upgrade Hugging Face plan
- Implement local-first strategy

### Logs
Check service logs for model loading status:
```bash
npm run start:dev
# Look for "🤖 Loading Hugging Face models..."
# Should see "✅ Hugging Face models loaded successfully"
```

## 📊 Model Comparison

| Model | Task | Size | Speed | Quality | API Required |
|-------|------|------|-------|---------|--------------|
| all-MiniLM-L6-v2 | Embeddings | 23MB | Fast | High | No |
| roberta-base-squad2 | Q&A | 500MB | Medium | Very High | No |
| bart-large-cnn | Summarization | 1.6GB | Slow | Very High | Optional |
| DialoGPT-medium | Generation | 350MB | Medium | High | Yes |

Choose based on your performance and quality requirements!
