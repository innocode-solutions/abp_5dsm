# 🔧 Configuração de Variáveis de Ambiente - Frontend

Este guia explica como configurar as variáveis de ambiente do frontend para conectar ao backend no Railway.

## 📋 Variáveis de Ambiente

### Para Produção (Railway/Deploy)

Configure as seguintes variáveis de ambiente no seu serviço de deploy (Railway, Vercel, etc.):

#### Obrigatória:
- `EXPO_PUBLIC_API_URL` - URL completa do backend no Railway
  - Exemplo: `https://seu-backend.railway.app/api`
  - **Importante**: Inclua o protocolo (`https://`) e o caminho `/api`

#### Opcional:
- `EXPO_PUBLIC_SOCKET_URL` - URL completa do WebSocket (se diferente da API)
  - Exemplo: `https://seu-backend.railway.app`
  - **Importante**: Socket.io conecta na raiz, não em `/api`
  - Se não definida, será derivada de `EXPO_PUBLIC_API_URL`

### Para Desenvolvimento Local

Crie um arquivo `.env` na raiz do diretório `frontend`:

```env
# Para desenvolvimento local - Backend na rede local
EXPO_PUBLIC_MACHINE_IP=192.168.18.7
EXPO_PUBLIC_BACKEND_PORT=8080

# IMPORTANTE: NÃO defina EXPO_PUBLIC_API_URL quando estiver desenvolvendo localmente
# Isso garante que use o IP local acima
```

**Nota**: O código prioriza `EXPO_PUBLIC_MACHINE_IP` sobre outras variáveis, garantindo que sempre use o IP local quando definido.

## 🚀 Como Funciona

### Prioridade de Configuração:

1. **`EXPO_PUBLIC_API_URL`** (Produção)
   - Se definida, usa diretamente a URL fornecida
   - Garante que termina com `/api`
   - Usa o protocolo, domínio e porta fornecidos

2. **`EXPO_PUBLIC_SOCKET_URL`** (Produção)
   - Se definida, usa diretamente para WebSocket
   - Remove `/api` automaticamente se presente
   - Se não definida, deriva de `EXPO_PUBLIC_API_URL`

3. **`EXPO_PUBLIC_MACHINE_IP`** (Desenvolvimento)
   - Usado para desenvolvimento local na rede
   - Monta URL manualmente: `http://{IP}:{PORT}/api`

4. **Fallback por Plataforma** (Desenvolvimento)
   - Android Emulator: `http://10.0.2.2:8080/api`
   - iOS Simulator: `http://localhost:8080/api`
   - Web: `http://localhost:8080/api`

## 📝 Exemplos

### Exemplo 1: Produção no Railway
```env
EXPO_PUBLIC_API_URL=https://meu-backend.railway.app/api
```

### Exemplo 2: Desenvolvimento Local (mesma máquina)
```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

### Exemplo 3: Desenvolvimento Local (rede)
```env
EXPO_PUBLIC_MACHINE_IP=192.168.1.100
EXPO_PUBLIC_BACKEND_PORT=8080
```

### Exemplo 4: Produção com WebSocket separado
```env
EXPO_PUBLIC_API_URL=https://api.meuapp.com/api
EXPO_PUBLIC_SOCKET_URL=https://ws.meuapp.com
```

## ⚠️ Importante

- **No Railway**: Configure `EXPO_PUBLIC_API_URL` com a URL completa do seu backend
- **No desenvolvimento**: Use `EXPO_PUBLIC_MACHINE_IP` ou `EXPO_PUBLIC_API_URL` com `localhost`
- **Socket.io**: Conecta na raiz do servidor, não em `/api`
- **HTTPS**: Em produção, sempre use `https://` para segurança

## 🔍 Verificação

Após configurar, verifique se a conexão está funcionando:

1. Abra o app
2. Tente fazer login
3. Verifique os logs do console (se em desenvolvimento)
4. Teste as funcionalidades que fazem chamadas à API

