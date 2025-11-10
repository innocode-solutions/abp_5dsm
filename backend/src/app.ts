// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from '../src/routes';
import { HealthService } from './service/healthService'; // Assumindo 'service'
import fs from 'fs';
import path from 'path';
import { sanitizeRequest } from './middleware/sanitizeMiddleware'; // Assumindo 'middleware'

dotenv.config(); // O dotenv.config() aqui é bom para a execução normal

const app = express();

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

// ======== EXPORTA O APP SEM INICIAR O SERVIDOR ========
export default app;