import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { checkMLServiceHealth } from './mlService';

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
      console.error('Database health check failed');
      res.status(503).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * ML service health check
   */
  static async mlHealthCheck(req: Request, res: Response) {
    try {
      const mlHealth = await checkMLServiceHealth();
      if (mlHealth.available) {
        res.json({
          status: 'OK',
          message: mlHealth.message,
          details: {
            pythonAvailable: mlHealth.pythonAvailable,
            scriptsAvailable: mlHealth.scriptsAvailable,
            modelsAvailable: mlHealth.modelsAvailable
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'ERROR',
          message: mlHealth.message,
          details: {
            pythonAvailable: mlHealth.pythonAvailable,
            scriptsAvailable: mlHealth.scriptsAvailable,
            modelsAvailable: mlHealth.modelsAvailable
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('ML health check failed');
      res.status(503).json({
        status: 'ERROR',
        message: 'ML service health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Graceful shutdown handler
   */
  static async gracefulShutdown(signal: string) {
    
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown');
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