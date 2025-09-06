# Multi-stage build for Agent Orchestrator
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/agent-orchestrator/package*.json ./apps/agent-orchestrator/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Agent Orchestrator
RUN npm run build -w @apex-flow/agent-orchestrator

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S agent -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/agent-orchestrator/package*.json ./apps/agent-orchestrator/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=agent:nodejs /app/apps/agent-orchestrator/dist ./apps/agent-orchestrator/dist
COPY --from=builder --chown=agent:nodejs /app/packages ./packages

# Change to non-root privilege
USER agent

# Expose port (assuming it runs on port 3001)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/agent-orchestrator/dist/main.js"]
