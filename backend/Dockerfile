# Multi-stage build for Node.js TypeScript backend
# Otimizado para Railway - Usa Debian para wheels pré-compiladas do llvmlite

# Stage 1: Build stage (mantém Alpine para build rápido)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (include devDependencies for build)
RUN npm ci

# Generate Prisma client
# DATABASE_URL dummy apenas para validação do schema durante o build
# Não afeta o runtime pois é definida apenas neste RUN
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production stage
# Usa Debian slim (glibc) para wheels pré-compiladas do llvmlite - MUITO MAIS RÁPIDO
FROM python:3.12-slim AS production

# Install Node.js 18 (LTS) e dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    dumb-init \
    wget \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip3 install --no-cache-dir --upgrade pip

# Create non-root user and group for security
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and Prisma assets from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma ./node_modules/.prisma

# Copy Python ML scripts and models
COPY --from=builder --chown=appuser:appgroup /app/src/ml ./src/ml
COPY --from=builder --chown=appuser:appgroup /app/requirements.txt ./requirements.txt

# Install Python dependencies (as root, before switching user)
# Usa wheels pré-compiladas - MUITO MAIS RÁPIDO que compilar do código fonte
RUN pip3 install --no-cache-dir -r requirements.txt

# Switch to non-root user
USER appuser

# Expose port (Railway will set PORT automatically via environment variable)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start script that runs migrations and starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
