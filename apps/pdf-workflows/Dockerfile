# Build stage
FROM node:20-alpine AS builder

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

# Build the application
RUN npm run build -w @apex-flow/pdf-workflows

# Production stage
FROM node:20-alpine

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S worker -u 1001

WORKDIR /app

# Copy package files
COPY apps/pdf-workflows/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=worker:nodejs /app/apps/pdf-workflows/dist ./dist

USER worker

# Health check for worker process
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "node.*worker.js" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/worker.js"]
