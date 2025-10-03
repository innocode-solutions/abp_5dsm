import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class HealthService {
  /**
   * Basic health check endpoint
   */
  static healthCheck(req: Request, res: Response) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'API rodando corretamente',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Database connection health check
   */
  static async databaseHealthCheck(req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ 
        status: 'OK', 
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(503).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Graceful shutdown handler
   */
  static async gracefulShutdown(signal: string) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      await prisma.$disconnect();
      console.log('Database connections closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Setup shutdown signal handlers
   */
  static setupShutdownHandlers() {
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }
}