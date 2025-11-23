# 🚀 Guia de Configuração e Inicialização

## 📋 Visão Geral

Este projeto integra o backend TypeScript com modelos de Machine Learning Python diretamente no backend, eliminando a necessidade de um serviço Python separado.

## 🏗️ Estrutura

```
abp_5dsm/
├── backend/              # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── ml/          # Modelos ML integrados (do ai_model)
│   │   │   ├── models/  # Scripts Python
│   │   │   ├── pipelines/ # Modelos .pkl
│   │   │   └── datasets/  # Datasets CSV
│   │   └── service/
│   │       └── mlService.ts # Executa Python via child_process
│   └── server.ts        # Servidor na porta 8080
├── frontend/            # React Native/Expo
└── ai_model/            # (Legado - pode ser removido)
```

## ⚙️ Configuração

### Backend
- **Porta**: 8080
- **API**: `http://localhost:8080/api`
- **Health**: `http://localhost:8080/health`

### Frontend
- **Porta padrão**: 8080
- **Configuração**: `frontend/src/api/apiConnection.ts`

## 🚀 Inicialização Rápida

### Opção 1: Script Automático (Recomendado)

**Windows (PowerShell)**:
```powershell
.\start-dev.ps1
```

**Windows (CMD)**:
```cmd
start-dev.bat
```

### Opção 2: Manual

**1. Backend**:
```bash
cd backend
npm install
npm run dev
```

**2. Frontend** (em outro terminal):
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuração de Rede Local

Para usar em dispositivos móveis na mesma rede:

1. **Descubra o IP da sua máquina**:
   ```powershell
   ipconfig
   # Procure por "IPv4" - exemplo: 192.168.1.100
   ```

2. **Configure o frontend**:
   Crie `frontend/.env`:
   ```env
   EXPO_PUBLIC_MACHINE_IP=192.168.1.100
   EXPO_PUBLIC_BACKEND_PORT=8080
   ```

3. **Reinicie o frontend**

## ✅ Verificação

### Backend
```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/ml
```

### Frontend
Verifique o console - deve aparecer:
```
🔗 API URL configurada: http://localhost:8080/api
```

## 🐍 Requisitos Python

O backend executa scripts Python diretamente. Certifique-se de ter:

1. **Python 3.x** instalado
2. **Dependências instaladas**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## 📝 Notas Importantes

- ✅ A lógica do `ai_model` está **integrada no backend** (`backend/src/ml/`)
- ✅ Não é necessário rodar o `ai_model` separadamente
- ✅ O backend executa Python via `child_process`
- ✅ Tudo funciona em um único processo Node.js

## 🔍 Troubleshooting

### Erro: "Script Python não encontrado"
- Verifique se `backend/src/ml/models/` existe
- Verifique se os scripts Python estão lá

### Erro: "Python não disponível"
- Instale Python 3.x
- Verifique se está no PATH: `python --version`

### Erro: "Porta 8080 já em uso"
- Altere a porta no `backend/server.ts` ou use `HTTP_PORT=8081 npm run dev`

### Erro de conexão no frontend
- Verifique se o backend está rodando: `curl http://localhost:8080/health`
- Verifique a URL no console do frontend
- Configure `EXPO_PUBLIC_MACHINE_IP` se usar dispositivo físico

