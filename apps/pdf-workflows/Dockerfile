# Multi-stage build for PDF Workflows Worker
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/pdf-workflows/package*.json ./apps/pdf-workflows/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the PDF Workflows Worker
RUN npm run build -w @apex-flow/pdf-workflows

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S worker -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/pdf-workflows/package*.json ./apps/pdf-workflows/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=worker:nodejs /app/apps/pdf-workflows/dist ./apps/pdf-workflows/dist
COPY --from=builder --chown=worker:nodejs /app/packages ./packages

# Change to non-root privilege
USER worker

# No port exposed as this is a worker service

# Health check for worker process
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep -v grep | grep "node.*worker.js" || exit 1

# Start the worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/pdf-workflows/dist/worker.js"]
