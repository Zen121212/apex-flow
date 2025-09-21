#!/bin/bash

# ApexFlow Development Environment Startup Script

set -e

echo "Starting ApexFlow Development Environment"
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
    echo -e "${GREEN}✅ Created .env file from template${NC}"
fi

# Check Visual AI service URL configuration
if ! grep -q "VISUAL_AI_SERVICE_URL=" .env; then
    echo -e "${YELLOW}⚠️  Adding Visual AI service URL to .env file...${NC}"
    echo "VISUAL_AI_SERVICE_URL=http://localhost:8000" >> .env
    echo -e "${GREEN}✅ Visual AI service URL configured${NC}"
fi

echo -e "${BLUE}🔧 Checking system dependencies...${NC}"

# Check for Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker found${NC}"
    
    # Start infrastructure services using main infrastructure setup
    echo -e "${YELLOW}🐳 Starting infrastructure services (MongoDB, Redis, MinIO, n8n, Visual AI, API Gateway, PDF Workflows)...${NC}"
    cd infrastructure
    docker compose up -d
    cd ..
    sleep 15  # Allow more time for Visual AI model loading and service startup
    
    echo -e "${GREEN}✅ Infrastructure services started${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found. Make sure MongoDB, Redis, MinIO, and n8n are running locally${NC}"
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

# Install service dependencies (only for local development, services run in Docker)
echo -e "${YELLOW}   Installing agent-orchestrator dependencies (for local dev)...${NC}"
cd apps/agent-orchestrator && npm install > /dev/null 2>&1 && cd ../..

echo -e "${YELLOW}   Installing react-web dependencies...${NC}"
cd apps/react-web && npm install > /dev/null 2>&1 && cd ../..

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
    
    # Start services in each pane (only local dev services, main services run in Docker)
    tmux send-keys -t apexflow:0.0 'cd apps/agent-orchestrator && npm run start:dev' Enter
    tmux send-keys -t apexflow:0.1 'cd apps/react-web && npm run start' Enter  
    tmux send-keys -t apexflow:1.0 'echo "🎯 ApexFlow Services Dashboard" && echo "=============================" && echo "" && echo "🐳 Docker Services (Main):" && echo "• API Gateway: http://localhost:3000" && echo "• PDF Workflows: Running in Docker" && echo "• Visual AI: http://localhost:8001" && echo "• n8n: http://localhost:5678" && echo "• MongoDB: localhost:27017" && echo "• Redis: localhost:6379" && echo "• MinIO: http://localhost:9001" && echo "" && echo "🖥️  Local Services:" && echo "• Agent Orchestrator: http://localhost:3002" && echo "• React Web: http://localhost:5173" && echo "" && echo "📋 Test Commands:" && echo "curl http://localhost:3000/health" && echo "curl http://localhost:8001/health" && echo "curl http://localhost:3002/health" && echo "" && bash' Enter
    tmux send-keys -t apexflow:1.1 'echo "📊 Docker Services Status:" && echo "=========================" && echo "" && echo "docker ps --format \"table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\"" && echo "" && echo "🔍 View logs:" && echo "docker logs apexflow-api-gateway" && echo "docker logs apexflow-visual-ai" && echo "docker logs apexflow-pdf-workflows" && echo "" && bash' Enter
    
    echo -e "${GREEN}✅ Services started in tmux session 'apexflow'${NC}"
    echo -e "${BLUE}   Use 'tmux attach -t apexflow' to view services${NC}"
    echo -e "${BLUE}   Use Ctrl+B then arrow keys to navigate panes${NC}"
    
    # Wait for services to start
    sleep 5
    
else
    echo -e "${YELLOW}⚠️  tmux not found. Please start services manually:${NC}"
    echo ""
    echo -e "${BLUE}Main Services (Docker):${NC} Already running via infrastructure/docker-compose.yml"
    echo -e "${BLUE}Terminal 1:${NC} cd apps/agent-orchestrator && npm run start:dev"
    echo -e "${BLUE}Terminal 2:${NC} cd apps/react-web && npm run start"
    echo ""
    read -p "Press Enter after starting local services..."
fi

# Health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Docker services (main infrastructure)
wait_for_service "http://localhost:3000/health" "API Gateway (Docker)"
wait_for_service "http://localhost:8001/health" "Visual AI Service (Docker)"
wait_for_service "http://localhost:5678/healthz" "n8n (Docker)"

# Local services
wait_for_service "http://localhost:3002/health" "Agent Orchestrator (Local)"
wait_for_service "http://localhost:5173" "React Web (Local)"

echo ""
echo -e "${GREEN}🎉 ApexFlow is ready!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📖 Quick Test Commands:${NC}"
echo ""
echo "# Test Visual AI service (Docker)"
echo 'curl -X GET http://localhost:8001/health'
echo ""
echo "# Test Visual AI extraction"
echo 'curl -X POST http://localhost:8001/extract-from-text \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d \'{"filename":"test.txt","content":"Invoice #12345 Amount: $100.00","mime_type":"text/plain"}\''
echo ""
echo "# Upload a test document"  
echo 'curl -X POST http://localhost:3000/documents/simple-upload \'
echo '  -H "Content-Type: application/json" \'
echo '  -d \'{"originalName":"test.txt","content":"ApexFlow is amazing!"}\''
echo ""
echo "# Test debug invoice extraction"
echo 'curl -X POST http://localhost:3000/debug/extract-invoice-data \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d \'{"filename":"test.txt","extractedText":"Invoice #12345\\nAmount: $100.00\\nVendor: ACME Corp","size":100}\''
echo ""
echo "# Ask a question (wait 30s after upload)"
echo 'curl -X POST http://localhost:3002/qa \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d \'{"query": "What is ApexFlow?"}\''
echo ""
echo -e "${BLUE}📚 Full documentation: END_TO_END_WORKFLOW.md${NC}"
echo -e "${BLUE}🌐 API Gateway (Docker): http://localhost:3000${NC}"
echo -e "${BLUE}🤖 Agent Orchestrator (Local): http://localhost:3002${NC}"
echo -e "${BLUE}🧠 Visual AI (Docker): http://localhost:8001${NC}"
echo -e "${BLUE}🔧 n8n Automation (Docker): http://localhost:5678${NC}"
echo -e "${BLUE}📦 MinIO Console (Docker): http://localhost:9001${NC}"
echo -e "${BLUE}⚛️  React Web (Local): http://localhost:5173${NC}"

if command -v tmux &> /dev/null; then
    echo ""
    echo -e "${YELLOW}💡 To view services: tmux attach -t apexflow${NC}"
    echo -e "${YELLOW}💡 To stop services: tmux kill-session -t apexflow${NC}"
fi

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
