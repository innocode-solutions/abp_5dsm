# Multi-stage build for Node.js TypeScript backend
# Otimizado para Railway

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (include devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install dumb-init, Python with dependencies for ML, and wget for healthcheck
RUN apk add --no-cache \
    dumb-init \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    g++ \
    make \
    libc-dev \
    wget \
    cmake \
    llvm \
    llvm-dev \
    && python3 -m pip install --upgrade pip --break-system-packages

# Create non-root user and group for security
RUN addgroup -g 1001 -S appgroup \
 && adduser -S appuser -u 1001 -G appgroup

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
# Instala globalmente para que o usuário não-root possa usar
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Switch to non-root user
USER appuser

# Expose port (Railway will set PORT automatically via environment variable)
# O EXPOSE é apenas informativo, o Railway usa a variável PORT
EXPOSE 8080

# Health check - Railway tem seu próprio healthcheck, mas este ajuda no desenvolvimento
# Nota: O healthcheck não pode usar variáveis dinâmicas, então usamos a porta padrão
# O Railway vai verificar o endpoint /health na porta definida por PORT
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start script that runs migrations and starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

