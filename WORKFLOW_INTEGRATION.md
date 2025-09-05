# ApexFlow Workflow Integration with AI Pipeline

## 🔄 How Workflows Work with AI Processing

Yes! **Workflows absolutely work** and are fully integrated with the AI document processing system we built. Here's exactly how it works:

## 🏗️ **Complete Workflow Architecture**

```
📄 Document Upload
        ↓
🤖 AI Processing (Hugging Face)
  • Text Extraction
  • Smart Chunking  
  • Embedding Generation
  • Vector Storage
        ↓
⚡ Workflow Execution
  • Content Analysis
  • Smart Routing
  • Integration Triggers
  • Notifications
        ↓
📊 Results & Actions
```

## 🎯 **Available Workflows**

### 1. **Document Processing Workflow** (`demo-workflow-1`)
```typescript
{
  id: 'demo-workflow-1',
  name: 'Document Processing Workflow',
  steps: [
    {
      name: 'Extract Text',           // ✅ AI-powered text extraction
      type: 'extract_text'
    },
    {
      name: 'Analyze Content',        // ✅ AI content analysis  
      type: 'analyze_content'
    },
    {
      name: 'Send Slack Notification', // ✅ Integration triggers
      type: 'send_notification'
    },
    {
      name: 'Store in Database',      // ✅ Data persistence
      type: 'store_data'
    }
  ]
}
```

## 🚀 **How to Create & Use Workflows**

### **Step 1: Upload Document with Workflow**
```bash
# Upload with automatic workflow execution
curl -X POST http://localhost:3000/documents/simple-upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "originalName": "business_plan.pdf",
    "content": "This is our comprehensive business plan...",
    "workflowId": "demo-workflow-1",
    "autoDetectWorkflow": true,
    "workflowSelectionMode": "hybrid"
  }'
```

**Response:**
```json
{
  "documentId": "64f7a1b2c3d4e5f6g7h8i9j0",
  "workflowSelection": {
    "workflowId": "demo-workflow-1",
    "confidence": 0.95,
    "reason": "Document type matches processing workflow"
  },
  "execution": {
    "id": "exec-1704235200000",
    "status": "started", 
    "startedAt": "2025-01-02T21:00:00.000Z"
  }
}
```

### **Step 2: Monitor Workflow Progress**
```bash
# Check workflow status
curl -X GET http://localhost:3000/documents/64f7a1b2c3d4e5f6g7h8i9j0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "64f7a1b2c3d4e5f6g7h8i9j0",
  "status": "PROCESSING",
  "workflowExecution": {
    "workflowId": "demo-workflow-1",
    "status": "RUNNING",
    "startedAt": "2025-01-02T21:00:00.000Z",
    "steps": [
      {
        "stepName": "Extract Text",
        "status": "COMPLETED",
        "result": {
          "extractedText": "This is our comprehensive business plan...",
          "wordCount": 1247,
          "chunks": 8,
          "embeddings": 8
        }
      },
      {
        "stepName": "Analyze Content", 
        "status": "RUNNING"
      }
    ]
  }
}
```

### **Step 3: AI Analysis Results**
After processing, the workflow provides:

```json
{
  "processingResults": {
    "extractedText": "Full document text...",
    "analysis": {
      "documentType": "Business Plan",
      "sentiment": "positive",
      "keyTerms": ["revenue", "market", "strategy"],
      "aiInsights": {
        "mainTopic": "Business strategy and financial projections",
        "confidence": 0.92,
        "summary": "A comprehensive business plan focusing on market expansion..."
      }
    },
    "embeddings": {
      "chunks": 8,
      "dimensions": 384,
      "searchReady": true
    }
  }
}
```

## 🧠 **AI-Enhanced Workflow Steps**

### **1. Extract Text (AI-Powered)**
- Uses **pdf-parse** for PDFs
- **Smart text cleaning** and formatting
- **Chunk generation** with overlap
- **Hugging Face embeddings** (384 dimensions)

### **2. Analyze Content (AI Analysis)**
- **Document classification** using AI
- **Sentiment analysis** with Hugging Face
- **Key term extraction** 
- **Topic modeling** and insights

### **3. Smart Routing (AI Decision)**
```typescript
// Workflow can route based on AI analysis
if (analysis.documentType === 'Invoice') {
  triggerWorkflow('invoice-processing-workflow');
} else if (analysis.sentiment === 'urgent') {
  triggerWorkflow('priority-notification-workflow');
}
```

### **4. Integration Actions**
- **Slack notifications** with AI summaries
- **Database storage** with metadata
- **Email alerts** with key insights
- **Webhook triggers** for external systems

## 🎨 **Creating Custom Workflows**

### **Enhanced Workflow with AI Features:**
```typescript
const aiEnhancedWorkflow = {
  id: 'ai-contract-analysis',
  name: 'AI Contract Analysis Workflow',
  steps: [
    {
      name: 'Extract & Chunk Text',
      type: 'ai_extract_text',
      config: {
        chunkSize: 500,
        overlap: 50,
        generateEmbeddings: true
      }
    },
    {
      name: 'AI Contract Analysis', 
      type: 'ai_analyze_content',
      config: {
        analysisType: 'contract',
        extractEntities: ['parties', 'dates', 'amounts'],
        riskAssessment: true
      }
    },
    {
      name: 'Generate AI Summary',
      type: 'ai_summarize',
      config: {
        maxLength: 200,
        focusAreas: ['key terms', 'obligations', 'deadlines']
      }
    },
    {
      name: 'Smart Notifications',
      type: 'conditional_notify',
      config: {
        conditions: [
          {
            if: 'riskScore > 0.7',
            then: 'notify_legal_team'
          },
          {
            if: 'hasDeadlines',
            then: 'create_calendar_events'  
          }
        ]
      }
    }
  ]
};
```

## 📊 **Workflow Management API**

### **List Available Workflows:**
```bash
curl http://localhost:3000/workflows
```

### **Get Workflow Details:**
```bash  
curl http://localhost:3000/workflows/demo-workflow-1
```

### **Get Workflow Options:**
```bash
curl http://localhost:3000/workflows/config/options \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🤖 **AI Integration Points**

### **1. Document Processing**
- **Text extraction** → PDF parsing
- **Chunking strategy** → Smart overlap
- **Embedding generation** → Hugging Face vectors
- **Vector storage** → MongoDB indexes

### **2. Content Analysis** 
- **Classification** → Document type detection
- **Sentiment** → Emotional analysis
- **Entities** → Named entity recognition  
- **Topics** → Key theme identification

### **3. Question Answering**
After workflow completion, documents are searchable:
```bash
curl -X POST http://localhost:3002/qa \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key terms in the contract?",
    "context": {"documentId": "64f7a1b2c3d4e5f6g7h8i9j0"}
  }'
```

## 🔄 **Real-World Workflow Examples**

### **1. Legal Document Processing**
```typescript
{
  triggers: ['pdf_upload', 'contract_type'],
  steps: [
    'ai_text_extraction',
    'legal_entity_recognition', 
    'risk_assessment',
    'compliance_check',
    'legal_team_notification'
  ]
}
```

### **2. Financial Report Analysis**
```typescript  
{
  triggers: ['financial_document'],
  steps: [
    'ai_table_extraction',
    'numerical_analysis',
    'trend_detection', 
    'anomaly_alerts',
    'stakeholder_dashboard_update'
  ]
}
```

### **3. Customer Support Tickets**
```typescript
{
  triggers: ['support_email', 'customer_inquiry'],
  steps: [
    'sentiment_analysis',
    'priority_classification',
    'auto_response_suggestion',
    'agent_assignment',
    'knowledge_base_update'
  ]
}
```

## ⚡ **Performance & Scaling**

### **Concurrent Processing**
- **Multiple workflows** can run simultaneously
- **Background processing** with BullMQ queues
- **AI model sharing** across workflow instances
- **Resource optimization** for embeddings

### **Monitoring & Analytics**
```bash
# Workflow execution stats
curl http://localhost:3000/workflows/stats

# AI processing metrics  
curl http://localhost:3002/hf-health

# Vector search performance
curl http://localhost:3002/vector-health
```

## ✅ **What's Ready Right Now**

1. ✅ **Upload documents with workflow selection**
2. ✅ **AI text extraction and chunking** 
3. ✅ **Hugging Face embeddings generation**
4. ✅ **Vector storage and search**
5. ✅ **Workflow step execution**
6. ✅ **Integration notifications**
7. ✅ **Q&A on processed documents**
8. ✅ **Workflow monitoring and status**

## 🚀 **Next Steps for Advanced Workflows**

1. **Visual Workflow Builder** - Drag & drop interface
2. **Conditional Logic** - If/then workflow branching  
3. **Custom AI Models** - Domain-specific Hugging Face models
4. **Real-time Triggers** - Webhook-based workflow starts
5. **Advanced Analytics** - Workflow performance dashboards

---

**🎯 YES! Workflows work seamlessly with the AI system. You can create powerful document processing pipelines that combine AI intelligence with business automation!**

Try it now:
```bash
./scripts/start-dev.sh
# Then upload a document with workflowId: "demo-workflow-1"
```
