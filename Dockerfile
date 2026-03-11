# Multi-stage build for NovaStream application
FROM node:22-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Frontend build stage
FROM base AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend build stage
FROM base AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

# Production stage
FROM node:22-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    ffmpeg \
    curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy dependencies
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./package.json

# Copy built applications
COPY --from=frontend-build --chown=nextjs:nodejs /app/out ./
COPY --from=frontend-build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=backend-build --chown=nextjs:nodejs /app/dist-server ./dist-server

# Copy public files
COPY --chown=nextjs:nodejs ./public ./public

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Start the application
CMD ["node", "dist-server/index.js"]