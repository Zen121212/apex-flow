# ApexFlow System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ApexFlow System                         │
└─────────────────────────────────────────────────────────────────┘

                           ┌──────────┐
                           │  Users   │
                           │(Browser) │
                           └────┬─────┘
                                │
                                ▼ HTTP Requests
                     ┌─────────────────────┐
                     │    React Frontend   │
                     │                     │
                     │ • Upload Files      │
                     │ • View Results      │
                     │ • Manage Workflows  │
                     └─────────┬───────────┘
                               │
                               ▼ HTTP API Calls
                     ┌─────────────────────┐
                     │   NestJS Backend    │
                     │                     │
                     │ • Receive Files     │
                     │ • Process Requests  │
                     │ • Handle Auth       │
                     └─────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Calls   │    │  NoSQL Queries  │    │  Slack API      │
│              │    │                 │    │                 │
│• OpenAI Call │    │• Read Documents │    │• Send Message   │
│• OCR Process │    │• Write Results  │    │• Get Response   │
│• ML Response │    │• Update Records │    │• Webhook Event  │
└──────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AI Response  │    │    MongoDB      │    │ Slack Response  │
│              │    │                 │    │                 │
│• Text Extract│    │• documents      │    │• User Action    │
│• Analysis    │    │• users          │    │• Approval       │
│• Insights    │    │• workflows      │    │• Notification   │
└──────────────┘    └─────────────────┘    └─────────────────┘
```

## Simple Data Flows

### 1. Document Upload
```
User → Upload File → HTTP Request → NestJS → Save to MongoDB
                                      ├─ OpenAI Call → Get Analysis
                                      └─ Slack Message → Send Notification
                                      │
                                      ▼
                                   JSON Response ← Return to React
```

### 2. AI Processing  
```
Document → OCR Call → Extract Text → OpenAI Call → Analysis Result → JSON Response
```

### 3. Slack Integration
```
Workflow Event → Slack API Call → Send Message → User Response → Update MongoDB → JSON Response
```

## How NestJS Returns Data

**Your system uses standard HTTP JSON responses (NOT WebSockets):**

- **React → NestJS**: `fetch()` HTTP requests with JSON body
- **NestJS → React**: JSON responses with data/status
- **File Upload**: `FormData` multipart → JSON response
- **Real-time Updates**: Polling (no WebSockets found)

## Response Examples

### Document Upload Response:
```json
{
  "success": true,
  "documentId": "abc123",
  "workflowExecution": {...},
  "message": "Document uploaded successfully"
}
```

### AI Analysis Response:
```json
{
  "extractedText": "Invoice #12345...",
  "confidence": 0.95,
  "analysis": {...},
  "processingTime": "2.3s"
}
```

## Communication Pattern
1. React makes HTTP request (`fetch`)
2. NestJS processes (OCR, AI, DB)
3. NestJS returns JSON response
4. React updates UI with response data
5. No real-time connections - just request/response
