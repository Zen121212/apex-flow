# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package/workspace manifests (same pattern as api-gateway)
COPY package*.json ./
COPY apps/agent-orchestrator/package*.json ./apps/agent-orchestrator/

# Install deps
RUN npm install

# Copy source
COPY . .

# Build agent-orchestrator
RUN npm run build -w @apex-flow/agent-orchestrator

# Production stage
FROM node:20-alpine

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S agent -u 1001

WORKDIR /app

# Copy runtime package.json
COPY apps/agent-orchestrator/package*.json ./

# Copy node_modules and built dist from builder (same pattern as api-gateway)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=agent:nodejs /app/apps/agent-orchestrator/dist ./dist

USER agent

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health').on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
