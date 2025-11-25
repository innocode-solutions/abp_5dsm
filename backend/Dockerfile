# Multi-stage build for Node.js TypeScript backend
# Otimizado para Railway - Backend usa serviço ML externo

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema (necessário para gerar o client)
COPY prisma ./prisma

# Install all dependencies (include devDependencies for build)
RUN npm ci

# Generate Prisma client
# DATABASE_URL dummy apenas para validação do schema durante o build
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Copy source code 
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production stage
# Usa Node.js slim - mais leve já que não precisa de Python
FROM node:18-slim AS production

# Install dependências do sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    wget \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
