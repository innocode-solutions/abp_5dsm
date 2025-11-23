import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload } from '../middleware/authMiddleware';

let io: SocketServer | null = null;

export interface PredictionCreatedEvent {
  IDMatricula: string;
  IDDisciplina: string;
  TipoPredicao: 'DESEMPENHO' | 'EVASAO';
  IDPrediction: string;
  createdAt: Date;
}

/**
 * Inicializa o servidor Socket.io
 */
export function initializeSocket(server: HttpServer | HttpsServer): SocketServer {
  // Em desenvolvimento, aceitar todas as origens (necessário para React Native)
  const corsOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'http://localhost:8080')
    : true; // Permite todas as origens em desenvolvimento

  io = new SocketServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticação para WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Token de autenticação não fornecido'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      (socket as any).user = {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        studentId: decoded.studentId,
      };
      next();
    } catch (error) {
      next(new Error('Token inválido ou expirado'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;

    // Permite que o cliente se inscreva em eventos de uma disciplina específica
    socket.on('subscribe:discipline', (subjectId: string) => {
      socket.join(`discipline:${subjectId}`);
    });

    // Permite que o cliente cancele a inscrição de uma disciplina
    socket.on('unsubscribe:discipline', (subjectId: string) => {
      socket.leave(`discipline:${subjectId}`);
    });
  });

  return io;
}

/**
 * Emite um evento quando uma predição é criada
 */
export function emitPredictionCreated(event: PredictionCreatedEvent): void {
  if (!io) {
    return;
  }

  // Emite para todos os clientes inscritos na disciplina
  io.to(`discipline:${event.IDDisciplina}`).emit('prediction:created', {
    IDMatricula: event.IDMatricula,
    IDDisciplina: event.IDDisciplina,
    TipoPredicao: event.TipoPredicao,
    IDPrediction: event.IDPrediction,
    createdAt: event.createdAt,
  });
}

/**
 * Obtém a instância do Socket.io (se inicializada)
 */
export function getSocketIO(): SocketServer | null {
  return io;
}

