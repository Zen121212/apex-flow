# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build -w @apex-flow/api-gateway

# Production stage
FROM node:20-alpine

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY apps/api-gateway/package*.json ./

# Copy node_modules from builder (production dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/dist ./dist

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health').on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
