# Build stage
FROM node:20-alpine AS builder

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

# Build the application
RUN npm run build -w @apex-flow/slack-bot

# Production stage
FROM node:20-alpine

RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S slackbot -u 1001

WORKDIR /app

# Copy package files
COPY apps/slack-bot/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=slackbot:nodejs /app/apps/slack-bot/dist ./dist

USER slackbot

EXPOSE 3002

# Health check for slack bot
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "node.*index.js" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
