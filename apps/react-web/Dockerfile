# Multi-stage build for React app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/react-web/package*.json ./apps/react-web/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build -w @apex-flow/react-web

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/apps/react-web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/react-web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
