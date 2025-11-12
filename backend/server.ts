import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './src/routes';
import { HealthService } from './src/service/healthService';
import { initializeSocket } from './src/service/socketService';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { sanitizeRequest } from './src/middleware/sanitizeMiddleware';

dotenv.config();
const app = express();

// ======== HTTPS CONFIGURATION ========
const basePath = process.cwd(); // garante caminho correto no Docker
const SSL_KEY_PATH = path.resolve(basePath, process.env.SSL_KEY_PATH || 'certs/server.key');
const SSL_CERT_PATH = path.resolve(basePath, process.env.SSL_CERT_PATH || 'certs/server.crt');

const useHttps = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);

let sslOptions: { key?: Buffer; cert?: Buffer } = {};
if (useHttps) {
  sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
  console.log('✅ Certificados SSL carregados com sucesso.');
} else {
  console.warn('⚠️  Certificados SSL não encontrados. O servidor rodará em HTTP apenas.');
}

// Ports
const HTTP_PORT = Number(process.env.HTTP_PORT) || 8080;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 8443;

// ======== Security middleware ========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ======== CORS configuration ========
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ======== Body parsing ========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======== Global input sanitization ========
app.use(sanitizeRequest);

// ======== Request timeout ========
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// ======== Health check endpoints ========
app.get('/health', HealthService.healthCheck);
app.get('/health/db', HealthService.databaseHealthCheck);

// ======== API routes ========
app.use('/api', routes);

// ======== 404 handler ========
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
  });
});

// ======== Global error handler ========
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
});

// ======== Graceful shutdown ========
HealthService.setupShutdownHandlers();

// ======== Start HTTPS and HTTP redirect ========

if (useHttps) {
  const httpsServer = https.createServer(sslOptions, app);
  
  // Inicializa Socket.io com o servidor HTTPS
  initializeSocket(httpsServer);
  
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`✅ HTTPS ativo em https://localhost:${HTTPS_PORT}`);
    console.log(`🌎 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health: https://localhost:${HTTPS_PORT}/health`);
    console.log(`🗄️  DB Health: https://localhost:${HTTPS_PORT}/health/db`);
    console.log(`📚 API: https://localhost:${HTTPS_PORT}/api`);
    console.log(`🔌 WebSocket ativo na porta ${HTTPS_PORT}`);
  });

  http.createServer((req, res) => {
    const host = req.headers.host?.replace(/:\d+$/, '');
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
  }).listen(HTTP_PORT, () => {
    console.log(`🟡 HTTP redirecionando → HTTPS na porta ${HTTP_PORT}`);
  });
} else {
  const httpServer = http.createServer(app);
  
  // Inicializa Socket.io com o servidor HTTP
  initializeSocket(httpServer);
  
  httpServer.listen(HTTP_PORT, () => {
    console.log(`🚀 Servidor HTTP rodando em http://localhost:${HTTP_PORT}`);
    console.log(`🔌 WebSocket ativo na porta ${HTTP_PORT}`);
  });
}

export default app;