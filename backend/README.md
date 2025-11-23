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

- [ML_INTEGRATION.md](./ML_INTEGRATION.md) - Detalhes da integração ML
- [START.md](./START.md) - Guia de início
- [README_ML.md](./README_ML.md) - Documentação dos modelos

## 🐍 Requisitos Python

O backend executa scripts Python diretamente. Certifique-se de ter:

- Python 3.x instalado
- Dependências instaladas: `pip install -r requirements.txt`

## 🔧 Troubleshooting

Veja [START.md](./START.md) para soluções de problemas comuns.
