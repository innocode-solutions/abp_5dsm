import io from "socket.io-client";
import { getToken } from "./tokenStore";
import { Platform } from "react-native";

// Tipo para o Socket
type ISocket = ReturnType<typeof io>;

// Função para obter a URL do Socket (mesma lógica do apiConnection)
function getSocketUrl(): string {
  // Se EXPO_PUBLIC_API_URL existir → usa ela primeiro
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Se EXPO_PUBLIC_MACHINE_IP existir → monta a URL manual
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    // ✅ Mobile sempre usa HTTP
    if (Platform.OS !== 'web') {
      return `http://${machineIp}:3333/api`;
    }
    // Web pode usar HTTP (HTTPS requer certificados válidos)
    return `http://${machineIp}:3333/api`;
  }

  // Android Emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3333/api";
  }

  // iOS Simulator ou Web
  return "http://localhost:3333/api";
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
    // ✅ Apenas log em desenvolvimento
    if (__DEV__) {
      console.log("✅ WebSocket conectado");
    }
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason: string) => {
    // ✅ Apenas log em desenvolvimento
    if (__DEV__) {
      console.log("❌ WebSocket desconectado:", reason);
    }
    if (reason === "io server disconnect") {
      socket?.connect();
    }
  });

  socket.on("connect_error", (error: Error) => {
    // ✅ Silenciar erros de conexão - WebSocket é opcional
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // ✅ Apenas log final em desenvolvimento
      if (__DEV__) {
        console.warn("⚠️ WebSocket não disponível (opcional)");
      }
      // ✅ Desabilitar reconexão automática após máximo de tentativas
      socket?.disconnect();
    }
  });

  socket.on("reconnect", (attemptNumber: number) => {
    if (__DEV__) {
      console.log(`🔄 WebSocket reconectado após ${attemptNumber} tentativas`);
    }
    reconnectAttempts = 0;
  });

  socket.on("reconnect_attempt", (attemptNumber: number) => {
    // ✅ Silenciar tentativas de reconexão
  });

  socket.on("reconnect_error", (error: Error) => {
    // ✅ Silenciar erros de reconexão
  });

  socket.on("reconnect_failed", () => {
    // ✅ Apenas log em desenvolvimento
    if (__DEV__) {
      console.warn("⚠️ WebSocket não disponível (opcional)");
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
        console.log("🔌 WebSocket desconectado");
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
  console.log(`📚 Inscrito na disciplina ${subjectId}`);
}

/**
 * Cancela a inscrição de uma disciplina
 */
export async function unsubscribeFromDiscipline(
  subjectId: string
): Promise<void> {
  if (socket?.connected) {
    socket.emit("unsubscribe:discipline", subjectId);
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
  sock.on("prediction:created", (event: PredictionCreatedEvent) => {
    console.log("📢 Evento prediction:created recebido:", event);
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
