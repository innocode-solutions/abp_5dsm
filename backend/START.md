# 🚀 Como Rodar o Backend

## Pré-requisitos

1. **Node.js** instalado (versão 18 ou superior)
2. **Python 3.x** instalado e disponível no PATH
3. **Dependências Python** instaladas

## Instalação

### 1. Instalar dependências Node.js
```bash
cd backend
npm install
```

### 2. Instalar dependências Python
```bash
pip install -r requirements.txt
```

### 3. Configurar banco de dados
```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações (se necessário)
npm run prisma:migrate
```

## Executar

### Modo Desenvolvimento
```bash
npm run dev
```

O servidor iniciará em `http://localhost:8080`

### Modo Produção
```bash
npm run build
npm start
```

## Verificar Saúde

### Health Check Geral
```bash
curl http://localhost:8080/health
```

### Health Check do Banco
```bash
curl http://localhost:8080/health/db
```

### Health Check do ML
```bash
curl http://localhost:8080/health/ml
```

## Endpoints Principais

- **API Base**: `http://localhost:8080/api`
- **Health**: `http://localhost:8080/health`
- **DB Health**: `http://localhost:8080/health/db`
- **ML Health**: `http://localhost:8080/health/ml`

## Troubleshooting

### Erro: "Script Python não encontrado"
- Verifique se os arquivos estão em `backend/src/ml/models/`
- Verifique se o caminho está correto no `mlService.ts`

### Erro: "Python não disponível"
- Instale Python 3.x
- Verifique se está no PATH: `python --version` ou `python3 --version`

### Erro: "ModuleNotFoundError" no Python
- Instale as dependências: `pip install -r requirements.txt`

### Erro: "@prisma/client" não encontrado
- Execute: `npm run prisma:generate`

