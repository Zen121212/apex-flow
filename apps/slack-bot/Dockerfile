# Multi-stage build for Slack Bot
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/slack-bot/package*.json ./apps/slack-bot/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Slack Bot
RUN npm run build -w @apex-flow/slack-bot

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S slackbot -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/slack-bot/package*.json ./apps/slack-bot/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=slackbot:nodejs /app/apps/slack-bot/dist ./apps/slack-bot/dist
COPY --from=builder --chown=slackbot:nodejs /app/packages ./packages

# Change to non-root privilege
USER slackbot

# Expose port (assuming it runs on port 3002)
EXPOSE 3002

# Health check for slack bot
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep -v grep | grep "node.*index.js" || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/slack-bot/dist/index.js"]
