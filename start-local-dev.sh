#!/bin/bash

echo "🚀 Starting API Gateway in Local Development Mode..."

# Navigate to API Gateway directory
cd /Users/Zen/Desktop/ApexFlow/apps/api-gateway

# Check if required services are running
echo "🔍 Checking required services..."

# Check MongoDB
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running on localhost:27017"
    echo "💡 Start it with: docker run -d --name mongo -p 27017:27017 mongo:latest"
    exit 1
else
    echo "✅ MongoDB is running"
fi

# Check Redis
if ! nc -z localhost 6379 2>/dev/null; then
    echo "❌ Redis is not running on localhost:6379"
    echo "💡 Start it with: docker run -d --name redis -p 6379:6379 redis:latest"
    exit 1
else
    echo "✅ Redis is running"
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
    echo "📄 Loading environment variables from .env.local"
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "⚠️  No .env.local file found, using default environment"
fi

# Ensure HF cache directory exists
mkdir -p /Users/Zen/Desktop/ApexFlow/.hf-cache

echo "🔧 Environment Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  MONGODB_URI: $MONGODB_URI"
echo "  REDIS_URL: $REDIS_URL"
echo "  HF_CACHE_DIR: $HF_CACHE_DIR"

echo ""
echo "🎯 Starting API Gateway with hot reload..."
echo "📍 API will be available at: http://localhost:$PORT"
echo "🔄 Press Ctrl+C to stop"
echo ""

# Start the development server with hot reload
npm run start:dev
