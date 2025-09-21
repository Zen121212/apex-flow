#!/bin/bash

# ApexFlow Complete Deployment Script with n8n Integration

echo "🚀 ApexFlow + n8n Deployment"
echo "============================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    local url=$3
    
    print_status $BLUE "🔍 Checking $service on port $port..."
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_status $GREEN "$service is running"
        return 0
    else
        print_status $RED "$service is not responding"
        return 1
    fi
}

# Check if Docker is running
print_status $BLUE "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_status $RED "Docker is not running. Please start Docker Desktop first."
    exit 1
fi
print_status $GREEN "Docker is running"

# Start n8n Service
print_status $BLUE "📦 Starting n8n Workflows Service..."
cd apps/n8n-workflows
npm run start:docker > /dev/null 2>&1
sleep 5

if check_service "n8n" "5678" "http://localhost:5678/healthz"; then
    print_status $GREEN "n8n is ready!"
else
    print_status $RED "Failed to start n8n"
    exit 1
fi

cd ../..

# Start API Gateway
print_status $BLUE "🌐 Starting API Gateway..."
cd apps/api-gateway

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "📦 Installing API Gateway dependencies..."
    npm install > /dev/null 2>&1
fi

# Start API Gateway in background
npm run start:dev > api-gateway.log 2>&1 &
API_GATEWAY_PID=$!
sleep 10

if check_service "API Gateway" "3000" "http://localhost:3000/health"; then
    print_status $GREEN "API Gateway is ready!"
else
    print_status $RED "Failed to start API Gateway"
    kill $API_GATEWAY_PID 2>/dev/null
    exit 1
fi

cd ../..

# Display running services
print_status $GREEN ""
print_status $GREEN "🎉 All services are running successfully!"
print_status $GREEN "======================================="
print_status $BLUE ""
print_status $BLUE "🔗 Service URLs:"
print_status $BLUE " • n8n UI: http://localhost:5678"
print_status $BLUE "   Username: admin"
print_status $BLUE "   Password: apexflow-n8n-2024"
print_status $BLUE ""
print_status $BLUE " • API Gateway: http://localhost:3000"
print_status $BLUE " • API Health: http://localhost:3000/health"
print_status $BLUE ""
print_status $BLUE "📋 n8n Webhook URLs:"
print_status $BLUE " • Approval: http://localhost:5678/webhook/approval"
print_status $BLUE " • Buttons: http://localhost:5678/webhook/approve"
print_status $BLUE ""

# Display next steps
print_status $YELLOW "📋 Next Steps:"
print_status $YELLOW "1. Open http://localhost:5678 and login to n8n"
print_status $YELLOW "2. Import workflow: apps/n8n-workflows/workflows/slack-approval-workflow.json"
print_status $YELLOW "3. Configure Slack credentials in n8n"
print_status $YELLOW "4. Activate the workflow (toggle switch)"
print_status $YELLOW "5. Test with the approval endpoint"
print_status $YELLOW ""

# Create test script
print_status $BLUE "📝 Creating test script..."
cat > test-full-approval-flow.js << 'EOF'
const axios = require('axios');

async function testCompleteFlow() {
    console.log('  Testing Complete ApexFlow + n8n Flow');
    console.log('=========================================');
    
    try {
        // Test 1: API Gateway Health
        console.log('1️⃣ Testing API Gateway health...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ API Gateway health:', healthResponse.data.status);
        
        // Test 2: n8n Health
        console.log('2️⃣ Testing n8n health...');
        const n8nHealth = await axios.get('http://localhost:5678/healthz');
        console.log('✅ n8n health:', n8nHealth.data.status);
        
        // Test 3: Create Approval Request
        console.log('3️⃣ Creating approval request...');
        const approvalData = {
            documentId: `test-doc-${Date.now()}`,
            workflowId: 'sensitive-document-workflow',
            stepName: 'Security Review',
            approvalType: 'document_processing',
            requesterId: 'user-zen',
            title: '🔐 Complete Flow Test',
            description: 'Testing the complete ApexFlow + n8n integration.',
            metadata: {
                documentName: 'test-contract.pdf',
                documentType: 'application/pdf',
                priority: 'high'
            },
            expiresInHours: 24
        };
        
        const approvalResponse = await axios.post('http://localhost:3000/approvals', approvalData);
        
        if (approvalResponse.status === 200) {
            const approval = approvalResponse.data.approval;
            console.log('✅ Approval created successfully!');
            console.log('   ID:', approval.id);
            console.log('   Status:', approval.status);
            console.log('');
            console.log('🎯 What should happen next:');
            console.log('   1. Check Slack for the interactive message');
            console.log('   2. Click approve/reject buttons');
            console.log('   3. See browser confirmation page');
            console.log('   4. Workflow continues based on decision');
            
            // Test 4: Check if we can retrieve the approval
            console.log('4️⃣ Verifying approval was stored...');
            const getApproval = await axios.get(`http://localhost:3000/approvals/${approval.id}`);
            console.log('✅ Approval retrieved:', getApproval.data.id);
            
        } else {
            console.log('  Failed to create approval');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            if (error.config?.url?.includes(':3000')) {
                console.log('  API Gateway not running on port 3000');
                console.log('   Run: cd apps/api-gateway && npm run start:dev');
            } else if (error.config?.url?.includes(':5678')) {
                console.log('  n8n not running on port 5678');
                console.log('   Run: cd apps/n8n-workflows && npm start');
            }
        } else {
            console.log('  Error:', error.message);
            if (error.response?.data) {
                console.log('   Response:', error.response.data);
            }
        }
    }
}

testCompleteFlow();
EOF

print_status $GREEN "Test script created: test-full-approval-flow.js"
print_status $BLUE ""

# Display management commands
print_status $YELLOW "🛠️ Management Commands:"
print_status $YELLOW " • Test system: node test-full-approval-flow.js"
print_status $YELLOW " • Stop n8n: cd apps/n8n-workflows && npm run stop"
print_status $YELLOW " • View n8n logs: cd apps/n8n-workflows && npm run logs"
print_status $YELLOW " • Stop API Gateway: kill $API_GATEWAY_PID"
print_status $YELLOW " • View API logs: tail -f apps/api-gateway/api-gateway.log"
print_status $YELLOW ""

# Save process ID for cleanup
echo $API_GATEWAY_PID > .api-gateway.pid
print_status $GREEN "🔄 Process IDs saved for cleanup"
print_status $GREEN ""
print_status $GREEN "🎊 Deployment complete! Your approval system is ready."

# Ask if user wants to test immediately
print_status $BLUE "Would you like to run the test now? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    print_status $BLUE "Running test..."
    node test-full-approval-flow.js
fi
