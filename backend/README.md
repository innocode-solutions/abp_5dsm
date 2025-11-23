# Backend - Sistema de Predição Acadêmica

Backend TypeScript/Node.js com integração direta de modelos de Machine Learning em Python.

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
# Node.js
npm install

# Python (se ainda não instalou)
pip install -r requirements.txt
```

### 2. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações (se necessário)
npm run prisma:migrate
```

### 3. Rodar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## ✅ Verificar Configuração

Execute o script de verificação:

```bash
node check-setup.js
```

## 📁 Estrutura

```
backend/
  src/
    ml/                    # Modelos ML integrados
      models/              # Scripts Python
      pipelines/           # Modelos .pkl
      datasets/           # Datasets CSV
    service/
      mlService.ts         # Serviço de execução Python
      predictionService.ts # Serviço de predições
    controllers/           # Controllers
    routes/                # Rotas
    middleware/            # Middlewares
  requirements.txt        # Dependências Python
```

## 🔍 Health Checks

- **Geral**: `GET /health`
- **Banco**: `GET /health/db`
- **ML**: `GET /health/ml`

## 📚 Documentação

- [README_ML.md](./README_ML.md) - Documentação dos modelos ML
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Guia de deploy no Railway

## 🐍 Requisitos Python

O backend executa scripts Python diretamente. Certifique-se de ter:

- Python 3.x instalado
- Dependências instaladas: `pip install -r requirements.txt`

## 🔧 Troubleshooting

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
