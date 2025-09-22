#!/bin/bash

# ApexFlow Environment Setup Script
# This script helps developers set up their local environment

echo "🚀 ApexFlow Environment Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        return 1
    fi
}

# Function to copy env file if it doesn't exist
copy_env() {
    if [ ! -f "$2" ]; then
        cp "$1" "$2"
        echo -e "${GREEN}✓${NC} Created: $2 from $1"
    else
        echo -e "${YELLOW}⚠${NC} Already exists: $2"
    fi
}

echo ""
echo "Checking environment files..."

# Check and copy environment files
copy_env ".env.example" ".env"
copy_env "apps/api-gateway/.env.example" "apps/api-gateway/.env"
copy_env "apps/react-web/.env.example" "apps/react-web/.env"

echo ""
echo "Checking for required tools..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is available"
else
    echo -e "${YELLOW}⚠${NC} Docker not found (optional for MongoDB/Redis)"
fi

echo ""
echo -e "${YELLOW}⚠ IMPORTANT:${NC} Update the .env files with your actual:"
echo "  • API keys (OpenAI, HuggingFace)"
echo "  • Database URLs"
echo "  • Slack tokens (if using Slack integration)"
echo ""
echo "See ENVIRONMENT_SETUP.md for detailed instructions."
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Edit .env files with real values"
echo "  2. Start databases: npm run db:start"
echo "  3. Install dependencies: npm install"
echo "  4. Start development: npm run dev"