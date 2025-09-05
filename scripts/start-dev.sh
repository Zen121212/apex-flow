#!/bin/bash

# ApexFlow Development Environment Startup Script

set -e

echo "🚀 Starting ApexFlow Development Environment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding${NC}"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        
        echo -e "${BLUE}   Attempt $attempt/$max_attempts...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start within timeout${NC}"
    return 1
}

# Check for required environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}🔧 Please edit .env file with your Hugging Face API key${NC}"
    echo -e "${RED}   HUGGINGFACE_API_KEY=your_key_here${NC}"
    read -p "Press Enter after updating .env file..."
fi

# Check for Hugging Face API key
if ! grep -q "HUGGINGFACE_API_KEY=hf_" .env; then
    echo -e "${RED}❌ Please set your Hugging Face API key in .env file${NC}"
    echo "Get your key from: https://huggingface.co/settings/tokens"
    exit 1
fi

echo -e "${BLUE}🔧 Checking system dependencies...${NC}"

# Check for Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker found${NC}"
    
    # Start MongoDB if not running
    if ! docker ps | grep -q apexflow-mongo; then
        echo -e "${YELLOW}🐳 Starting MongoDB container...${NC}"
        docker run -d --name apexflow-mongo -p 27017:27017 mongo:latest
        sleep 3
    fi
    
    # Start Redis if not running
    if ! docker ps | grep -q apexflow-redis; then
        echo -e "${YELLOW}🐳 Starting Redis container...${NC}"
        docker run -d --name apexflow-redis -p 6379:6379 redis:alpine
        sleep 2
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found. Make sure MongoDB and Redis are running locally${NC}"
fi

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install root dependencies
npm install > /dev/null 2>&1

# Install service dependencies
echo -e "${YELLOW}   Installing agent-orchestrator dependencies...${NC}"
cd apps/agent-orchestrator && npm install > /dev/null 2>&1 && cd ../..

echo -e "${YELLOW}   Installing api-gateway dependencies...${NC}"
cd apps/api-gateway && npm install > /dev/null 2>&1 && cd ../..

echo -e "${YELLOW}   Installing pdf-workflows dependencies...${NC}"
cd apps/pdf-workflows && npm install > /dev/null 2>&1 && cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create tmux session or provide manual instructions
if command -v tmux &> /dev/null; then
    echo -e "${BLUE}🖥️  Starting services in tmux session...${NC}"
    
    # Create new tmux session
    tmux new-session -d -s apexflow
    
    # Split into 3 panes
    tmux split-window -h
    tmux split-window -v
    tmux select-pane -t 0
    tmux split-window -v
    
    # Start services in each pane
    tmux send-keys -t apexflow:0.0 'cd apps/agent-orchestrator && npm run start:dev' Enter
    tmux send-keys -t apexflow:0.1 'cd apps/pdf-workflows && npm run start:dev' Enter  
    tmux send-keys -t apexflow:1.0 'cd apps/api-gateway && npm run start:dev' Enter
    tmux send-keys -t apexflow:1.1 'echo "🎯 Services Status Dashboard" && echo "=========================" && echo "" && echo "Use these commands to test:" && echo "" && echo "# Health checks" && echo "curl http://localhost:3000/health" && echo "curl http://localhost:3002/health" && echo "curl http://localhost:3002/hf-health" && echo "" && echo "# Upload test document" && echo "echo \"Sample document content\" > test.txt" && echo "curl -X POST http://localhost:3000/documents/simple-upload \\\\" && echo "  -H \"Content-Type: application/json\" \\\\" && echo "  -d \\"{\\\"originalName\\\":\\\"test.txt\\\",\\\"content\\\":\\\"Sample content\\\"}\\\"" && echo "" && echo "# Ask questions" && echo "curl -X POST http://localhost:3002/qa \\\\" && echo "  -H \"Content-Type: application/json\" \\\\" && echo "  -d \\"{\\\"query\\\":\\\"What is this document about?\\\"}\\\"" && echo "" && bash' Enter
    
    echo -e "${GREEN}✅ Services started in tmux session 'apexflow'${NC}"
    echo -e "${BLUE}   Use 'tmux attach -t apexflow' to view services${NC}"
    echo -e "${BLUE}   Use Ctrl+B then arrow keys to navigate panes${NC}"
    
    # Wait for services to start
    sleep 5
    
else
    echo -e "${YELLOW}⚠️  tmux not found. Please start services manually:${NC}"
    echo ""
    echo -e "${BLUE}Terminal 1:${NC} cd apps/agent-orchestrator && npm run start:dev"
    echo -e "${BLUE}Terminal 2:${NC} cd apps/pdf-workflows && npm run start:dev"  
    echo -e "${BLUE}Terminal 3:${NC} cd apps/api-gateway && npm run start:dev"
    echo ""
    read -p "Press Enter after starting all services..."
fi

# Health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"

wait_for_service "http://localhost:3002/health" "Agent Orchestrator"
wait_for_service "http://localhost:3000/health" "API Gateway"

# Advanced health checks
echo -e "${BLUE}🧠 Checking AI services...${NC}"
wait_for_service "http://localhost:3002/hf-health" "Hugging Face Models"
wait_for_service "http://localhost:3002/vector-health" "Vector Storage"

echo ""
echo -e "${GREEN}🎉 ApexFlow is ready!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📖 Quick Test Commands:${NC}"
echo ""
echo "# Test embedding generation"
echo 'curl -X POST http://localhost:3002/embeddings \'
echo '  -H "Content-Type: application/json" \'
echo '  -d \'{"text": "Hello ApexFlow"}\''
echo ""
echo "# Upload a test document"  
echo 'curl -X POST http://localhost:3000/documents/simple-upload \'
echo '  -H "Content-Type: application/json" \'
echo '  -d \'{"originalName":"test.txt","content":"ApexFlow is amazing!"}\''
echo ""
echo "# Ask a question (wait 30s after upload)"
echo 'curl -X POST http://localhost:3002/qa \'
echo '  -H "Content-Type: application/json" \'
echo '  -d \'{"query": "What is ApexFlow?"}\''
echo ""
echo -e "${BLUE}📚 Full documentation: END_TO_END_WORKFLOW.md${NC}"
echo -e "${BLUE}🌐 API Gateway: http://localhost:3000${NC}"
echo -e "${BLUE}🤖 Agent Orchestrator: http://localhost:3002${NC}"

if command -v tmux &> /dev/null; then
    echo ""
    echo -e "${YELLOW}💡 To view services: tmux attach -t apexflow${NC}"
    echo -e "${YELLOW}💡 To stop services: tmux kill-session -t apexflow${NC}"
fi

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
