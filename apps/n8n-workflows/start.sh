#!/bin/bash

# ApexFlow n8n Service Startup Script

echo "🚀 Starting ApexFlow n8n Workflow Service"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose could not be found. Please install Docker Compose."
    exit 1
fi

# Create workflows directory if it doesn't exist
mkdir -p workflows

echo "📦 Starting n8n container..."
docker-compose up -d

# Wait for n8n to be ready
echo "⏳ Waiting for n8n to be ready..."
sleep 10

# Check if n8n is running
if docker-compose ps | grep -q "apexflow-n8n.*Up"; then
    echo "✅ n8n is running successfully!"
    echo ""
    echo "🎯 Access n8n at: http://localhost:5678"
    echo "👤 Username: admin"
    echo "🔐 Password: apexflow-n8n-2024"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open http://localhost:5678 in your browser"
    echo "2. Login with the credentials above"
    echo "3. Import the workflow from: workflows/slack-approval-workflow.json"
    echo "4. Configure Slack credentials"
    echo "5. Activate the workflow"
    echo ""
    echo "📖 For full setup instructions, see: ../N8N_APPROVAL_SETUP.md"
    echo ""
    echo "🛑 To stop n8n: docker-compose down"
    echo "📝 To view logs: docker-compose logs -f"
else
    echo "❌ Failed to start n8n. Check the logs:"
    docker-compose logs
    exit 1
fi
