# 🔒 Environment Setup Guide

## Quick Start

1. **Copy environment templates:**
   ```bash
   # Root level
   cp .env.example .env
   
   # API Gateway
   cp apps/api-gateway/.env.example apps/api-gateway/.env
   
   # React Web App
   cp apps/react-web/.env.example apps/react-web/.env
   ```

2. **Update with your actual values:**
   - Replace API keys with real ones
   - Update database URLs
   - Configure Slack integration tokens

## 🔑 Required API Keys

### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env` as `OPENAI_API_KEY=sk-your-key-here`

### HuggingFace API Token
1. Visit https://huggingface.co/settings/tokens
2. Create new token with read permissions
3. Add to `.env` as `HUGGINGFACE_API_KEY=hf_your-token-here`

### Slack Integration (Optional)
1. Create Slack app at https://api.slack.com/apps
2. Get Bot User OAuth Token → `SLACK_BOT_TOKEN`
3. Get Signing Secret → `SLACK_SIGNING_SECRET`

## 🗃️ Database Setup

### MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally: https://docs.mongodb.com/manual/installation/
```

### Redis
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Or install locally: https://redis.io/docs/getting-started/installation/
```

## ⚠️ Security Notes

- **Never commit .env files** - they contain secrets
- Only `.env.example` files should be in version control
- Use different values for development/staging/production
- Rotate API keys regularly

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Start all services
npm run dev
```

Services will run on:
- React Web: http://localhost:5173
- API Gateway: http://localhost:3000  
- Slack Bot: http://localhost:3001
- Agent Orchestrator: http://localhost:3002