# Build stage (Debian-based to support onnxruntime-node glibc)
FROM node:20-bookworm-slim AS builder

# Install build dependencies for native modules (canvas, sharp, etc.)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
  python3 build-essential pkg-config \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  libvips-dev \
  && apt-get autoremove -y && apt-get autoclean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copy package/workspace manifests
COPY package*.json ./
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/

# Install deps
RUN npm install

# Copy source
COPY . .

# Build API Gateway
RUN npm run build -w @apex-flow/api-gateway

# Runtime stage (Debian-based)
FROM node:20-bookworm-slim

# Install runtime libs (glbc already present), plus OpenMP for onnxruntime and sharp
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
  dumb-init \
  libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
  libgomp1 libvips42 \
  && apt-get autoremove -y && apt-get autoclean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create non-root user
RUN useradd -m -u 1001 nestjs

# Create cache directory with correct permissions
RUN mkdir -p /app/cache/huggingface && chown -R nestjs:nestjs /app/cache

WORKDIR /app

# Copy runtime package.json
COPY apps/api-gateway/package*.json ./

# Copy node_modules and built dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/apps/api-gateway/dist ./dist

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health').on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]