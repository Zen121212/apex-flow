# ApexFlow n8n Workflows Service

This service manages workflow automation for ApexFlow using n8n, specifically handling Slack-based approval workflows.

## 🚀 Quick Start

1. **Start the service:**
   ```bash
   npm start
   # or
   ./start.sh
   ```

2. **Access n8n UI:**
   - Open: http://localhost:5678
   - Username: `admin`
   - Password: `apexflow-n8n-2024`

3. **Import the workflow:**
   - In n8n UI: Click "+" → "Import from file"
   - Select: `workflows/slack-approval-workflow.json`
   - Click "Import workflow"

4. **Configure Slack credentials:**
   - Go to "Credentials" → "Add Credential" → "Slack API"
   - Add your Slack token
   - Name it "Slack API"

5. **Activate the workflow:**
   - Click the "Inactive" toggle to activate

## 📁 Project Structure

```
apps/n8n-workflows/
├── workflows/
│   └── slack-approval-workflow.json    # Main approval workflow
├── docker-compose.yml                  # Docker configuration
├── start.sh                           # Startup script
├── package.json                       # Package configuration
├── .env                              # Environment variables
└── README.md                         # This file
```

## 🐳 Docker Commands

```bash
# Start n8n (recommended)
npm start

# Start with docker-compose directly
npm run start:docker

# Stop the service
npm run stop

# View logs
npm run logs

# Check status
npm run status

# Restart service
npm run restart
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# n8n Configuration
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_PROTOCOL=http

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=apexflow-n8n-2024

# Webhooks
WEBHOOK_URL=http://localhost:5678/

# ApexFlow Integration
APEXFLOW_API_URL=http://localhost:3000
SLACK_CHANNEL=#approvals
```

### Docker Compose Configuration

The service uses Docker Compose for easy deployment and management:

- **Container**: `apexflow-n8n`
- **Port**: 5678
- **Network**: `apexflow-network`
- **Volume**: `n8n_data` for persistence

## 🎯 Workflow Overview

The main workflow (`slack-approval-workflow.json`) includes:

### 1. Approval Request Webhook
- **Endpoint**: `POST /webhook/approval`
- **Purpose**: Receives approval requests from ApexFlow API

### 2. Message Formatting
- **Purpose**: Formats approval data into Slack message blocks
- **Features**: Interactive buttons, rich formatting, metadata display

### 3. Slack Message Posting
- **Purpose**: Sends formatted message to Slack channel
- **Channel**: Configurable (default: #approvals)

### 4. Button Action Webhook
- **Endpoint**: `POST /webhook/approve`
- **Purpose**: Handles Slack button clicks (approve/reject)

### 5. Decision Processing
- **Purpose**: Parses button actions and extracts decision data
- **Output**: Structured approval decision

### 6. API Callback
- **Purpose**: Sends decision back to ApexFlow API
- **Endpoint**: `POST /approvals/:id/decision`

### 7. Response Page
- **Purpose**: Shows success/error page to user
- **Format**: HTML page with confirmation

## 🔗 Integration Points

### With ApexFlow API Gateway

1. **Incoming**: ApexFlow sends approval requests to n8n webhook
2. **Outgoing**: n8n sends decisions back to ApexFlow API

### With Slack

1. **Message Posting**: Sends interactive approval messages
2. **Button Handling**: Receives and processes button clicks

## 🧪 Testing

### Test Approval Request

```bash
curl -X POST http://localhost:5678/webhook/approval \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "title": "Test Approval",
    "description": "Testing the n8n workflow",
    "approvalType": "document_processing",
    "requesterId": "user-test",
    "metadata": {
      "documentName": "test.pdf",
      "priority": "high"
    },
    "expiresInHours": 24
  }'
```

### Test Button Action (simulate Slack)

```bash
curl -X POST http://localhost:5678/webhook/approve \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "{\"actions\":[{\"action_id\":\"approve_button\",\"value\":\"test-123\"}],\"user\":{\"id\":\"U123\",\"name\":\"testuser\"}}"
  }'
```

## 🚦 Production Deployment

### Environment Variables

For production, update these variables:

```bash
# Production settings
N8N_HOST=your-domain.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-domain.com/
N8N_BASIC_AUTH_PASSWORD=your-secure-password

# Database (recommended for production)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=your-postgres-host
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=your-db-password
```

### Database Setup

Uncomment the PostgreSQL service in `docker-compose.yml` for production:

```yaml
postgres:
  image: postgres:15
  restart: unless-stopped
  environment:
    - POSTGRES_USER=n8n
    - POSTGRES_PASSWORD=n8n_password
    - POSTGRES_DB=n8n
```

## 🛠️ Development

### Workflow Development

1. **Edit in n8n UI**: Visual editor for easy modifications
2. **Export changes**: `npm run export` to save to JSON
3. **Import changes**: `npm run import` to load from JSON

### Custom Nodes

Add custom nodes by modifying the Docker image or using n8n community nodes.

### Debugging

View detailed logs:

```bash
npm run logs
```

Enable debug mode by setting `N8N_LOG_LEVEL=debug` in the environment.

## 🔍 Monitoring

### Health Check

Check if n8n is running:

```bash
curl http://localhost:5678/healthz
```

### Webhook Endpoints

After activation, the workflow exposes:

- `http://localhost:5678/webhook/approval` - For approval requests
- `http://localhost:5678/webhook/approve` - For button actions

### Logs

Monitor workflow executions in the n8n UI under "Executions" tab.

## 🆘 Troubleshooting

### Common Issues

1. **n8n not starting**
   - Check Docker is running: `docker info`
   - Check port 5678 is free: `lsof -i :5678`

2. **Webhook not receiving data**
   - Verify workflow is active (green toggle in n8n UI)
   - Check ApexFlow API Gateway configuration
   - Test webhook directly with curl

3. **Slack integration issues**
   - Verify Slack credentials are configured
   - Check Slack token permissions
   - Ensure Slack channel exists

4. **API callback failures**
   - Verify ApexFlow API Gateway is running on port 3000
   - Check network connectivity between containers
   - Review API Gateway logs

### Reset Everything

```bash
# Stop and remove containers
npm run stop

# Remove volumes (WARNING: This deletes all n8n data)
docker volume rm n8n-workflows_n8n_data

# Restart
npm start
```

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Slack API Documentation](https://api.slack.com/)
- [ApexFlow Setup Guide](../N8N_APPROVAL_SETUP.md)

## 🤝 Support

For issues with this service:

1. Check the logs: `npm run logs`
2. Review the workflow execution in n8n UI
3. Test individual webhook endpoints
4. Check ApexFlow API Gateway connectivity
