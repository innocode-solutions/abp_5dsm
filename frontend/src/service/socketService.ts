import { io, Socket } from 'socket.io-client';
import { getToken } from './tokenStore';

// Usar a mesma URL base da API, mas sem o /api
const SOCKET_URL = 'http://localhost:8080';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface PredictionCreatedEvent {
  IDMatricula: string;
  IDDisciplina: string;
  TipoPredicao: 'DESEMPENHO' | 'EVASAO';
  IDPrediction: string;
  createdAt: string;
}

export type PredictionCreatedCallback = (event: PredictionCreatedEvent) => void;

/**
 * Conecta ao servidor WebSocket
 */
export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const token = await getToken();
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket conectado');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket desconectado:', reason);
    if (reason === 'io server disconnect') {
      // Servidor desconectou o cliente, reconectar manualmente
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Erro ao conectar WebSocket:', error.message);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 WebSocket reconectado após ${attemptNumber} tentativas`);
    reconnectAttempts = 0;
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Tentativa de reconexão ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`);
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Erro ao reconectar WebSocket:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Falha ao reconectar WebSocket após todas as tentativas');
  });

  return socket;
}

/**
 * Desconecta do servidor WebSocket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 WebSocket desconectado');
  }
}

/**
 * Inscreve-se em eventos de uma disciplina específica
 */
export async function subscribeToDiscipline(subjectId: string): Promise<void> {
  const sock = await connectSocket();
  sock.emit('subscribe:discipline', subjectId);
  console.log(`📚 Inscrito na disciplina ${subjectId}`);
}

/**
 * Cancela a inscrição de uma disciplina
 */
export async function unsubscribeFromDiscipline(subjectId: string): Promise<void> {
  if (socket?.connected) {
    socket.emit('unsubscribe:discipline', subjectId);
    console.log(`📚 Inscrição cancelada na disciplina ${subjectId}`);
  }
}

/**
 * Escuta eventos de predições criadas
 */
export async function onPredictionCreated(
  callback: PredictionCreatedCallback
): Promise<void> {
  const sock = await connectSocket();
  sock.on('prediction:created', (event: PredictionCreatedEvent) => {
    console.log('📢 Evento prediction:created recebido:', event);
    callback(event);
  });
}

/**
 * Remove o listener de predições criadas
 */
export function offPredictionCreated(): void {
  if (socket) {
    socket.off('prediction:created');
  }
}

/**
 * Verifica se o socket está conectado
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Obtém a instância do socket (se conectada)
 */
export function getSocket(): Socket | null {
  return socket;
}

