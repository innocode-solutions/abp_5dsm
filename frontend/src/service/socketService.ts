import io from "socket.io-client";
import { getToken } from "./tokenStore";
import { Platform } from "react-native";

// Tipo para o Socket
type ISocket = ReturnType<typeof io>;

// Função para obter a URL do Socket
// IMPORTANTE: Socket.io conecta na raiz do servidor, NÃO em /api
function getSocketUrl(): string {
  // Porta padrão do backend (SEMPRE 8080, nunca 3000)
  const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '8080';
  
  // PRIORIDADE 1: Se EXPO_PUBLIC_MACHINE_IP existir → monta a URL manual (desenvolvimento local)
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    // ✅ Socket.io conecta na raiz do servidor, não em /api
    const url = `http://${machineIp}:${backendPort}`;
    console.log('🔌 Socket usando IP local:', url);
    return url;
  }
  
  // PRIORIDADE 2: Se EXPO_PUBLIC_SOCKET_URL existir → usa ela diretamente (produção/Railway)
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    try {
      const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
      // Remove /api do final se existir (Socket.io conecta na raiz)
      const urlWithoutApi = socketUrl.replace(/\/api\/?$/, '');
      const urlObj = new URL(urlWithoutApi);
      // FORÇA a porta 8080 se não estiver especificada ou se for 3000
      if (!urlObj.port || urlObj.port === '8080') {
        urlObj.port = backendPort;
      }
      console.log('🔌 Socket usando SOCKET_URL:', urlObj.toString());
      return urlObj.toString();
    } catch {
      // Se a URL for inválida, ignora e usa a lógica padrão
    }
  }

  // PRIORIDADE 3: Se EXPO_PUBLIC_API_URL existir, remove /api e usa diretamente (produção/Railway)
  if (process.env.EXPO_PUBLIC_API_URL) {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      // Remove /api do final se existir (Socket.io conecta na raiz)
      const urlWithoutApi = apiUrl.replace(/\/api\/?$/, '');
      const urlObj = new URL(urlWithoutApi);
      // FORÇA a porta 8080 se não estiver especificada ou se for 3000
      if (!urlObj.port || urlObj.port === '8080') {
        urlObj.port = backendPort;
      }
      console.log('🔌 Socket usando API_URL:', urlObj.toString());
      return urlObj.toString();
    } catch {
      // Se a URL for inválida, ignora e usa a lógica padrão
    }
  }

  // PRIORIDADE 4: Android Emulator
  if (Platform.OS === "android") {
    const url = `http://192.168.18.7:${backendPort}`;
    console.log('🔌 Socket usando Android Emulator:', url);
    return url;
  }

  // PRIORIDADE 5: iOS Simulator ou Web
  const url = `http://192.168.18.7:${backendPort}`;
  console.log('🔌 Socket usando localhost:', url);
  return url;
}

const SOCKET_URL = getSocketUrl();

let socket: ISocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface PredictionCreatedEvent {
  IDMatricula: string;
  IDDisciplina: string;
  TipoPredicao: "DESEMPENHO" | "EVASAO";
  IDPrediction: string;
  createdAt: string;
}

export type PredictionCreatedCallback = (event: PredictionCreatedEvent) => void;

/**
 * Conecta ao servidor WebSocket
 */
export async function connectSocket(): Promise<ISocket> {
  if (socket?.connected) {
    return socket;
  }

  const token = await getToken();

  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    // ✅ Adicionar timeout para evitar tentativas infinitas
    timeout: 5000,
    // ✅ Desabilitar logs automáticos do socket.io
    autoConnect: true,
  });

  socket.on("connect", () => {
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason: string) => {
    if (reason === "io server disconnect") {
      socket?.connect();
    }
  });

  socket.on("connect_error", (error: Error) => {
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      socket?.disconnect();
    }
  });

  socket.on("reconnect", (attemptNumber: number) => {
    reconnectAttempts = 0;
  });

  socket.on("reconnect_attempt", (attemptNumber: number) => {
    // Silenciar tentativas de reconexão
  });

  socket.on("reconnect_error", (error: Error) => {
    // Silenciar erros de reconexão
  });

  socket.on("reconnect_failed", () => {
    // ✅ Apenas log em desenvolvimento
    if (__DEV__) {
    }
  });

  return socket;
}

/**
 * Desconecta do servidor WebSocket
 */
export function disconnectSocket(): void {
  if (socket) {
    try {
      // ✅ Desabilitar reconexão automática antes de desconectar
      socket.io.opts.reconnection = false;
      socket.disconnect();
      socket.removeAllListeners(); // ✅ Limpar todos os listeners
      socket = null;
      
      // ✅ Apenas log em desenvolvimento
      if (__DEV__) {
      }
    } catch (error) {
      // ✅ Ignorar erros ao desconectar
      socket = null;
    }
  }
}

/**
 * Inscreve-se em eventos de uma disciplina específica
 */
export async function subscribeToDiscipline(subjectId: string): Promise<void> {
  const sock = await connectSocket();
  sock.emit("subscribe:discipline", subjectId);
}

/**
 * Cancela a inscrição de uma disciplina
 */
export async function unsubscribeFromDiscipline(
  subjectId: string
): Promise<void> {
  if (socket?.connected) {
    socket.emit("unsubscribe:discipline", subjectId);
  }
}

/**
 * Escuta eventos de predições criadas
 */
export async function onPredictionCreated(
  callback: PredictionCreatedCallback
): Promise<void> {
  const sock = await connectSocket();
  sock.on("prediction:created", (event: PredictionCreatedEvent) => {
    callback(event);
  });
}

/**
 * Remove o listener de predições criadas
 */
export function offPredictionCreated(): void {
  if (socket) {
    socket.off("prediction:created");
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
export function getSocket(): ISocket | null {
  return socket;
}
