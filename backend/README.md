# Backend - Sistema de Predição Acadêmica

Backend TypeScript/Node.js com integração via API REST com serviço de Machine Learning externo.

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
# Node.js
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `backend` com as seguintes variáveis:

```bash
# Database Configuration (OBRIGATÓRIO)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/academic_management

# JWT Configuration (OBRIGATÓRIO)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# ML Service URL (padrão: serviço externo no Railway)
ML_SERVICE_URL=https://aimodel-teste-deploy.up.railway.app
```

**Importante**: Substitua os valores acima pelos seus valores reais, especialmente `DATABASE_URL` e `JWT_SECRET`.

### 3. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações (se necessário)
npm run prisma:migrate
```

### 4. Rodar o Servidor

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
    service/
      mlService.ts         # Cliente HTTP para serviço de ML externo
      predictionService.ts # Serviço de predições que usa mlService
    controllers/           # Controllers
    routes/                # Rotas
    middleware/            # Middlewares
```

## 🔗 Configuração do Serviço de ML

O backend se conecta a um serviço de ML externo. Configure a variável de ambiente:

```bash
# Produção (padrão)
ML_SERVICE_URL=https://aimodel-teste-deploy.up.railway.app

# Desenvolvimento local (se rodar o serviço ML localmente)
ML_SERVICE_URL=http://localhost:5000
```

## 🔍 Health Checks

- **Geral**: `GET /health`
- **Banco**: `GET /health/db`
- **ML**: `GET /health/ml`

## 📚 Documentação

- [README_ML.md](./README_ML.md) - Documentação dos modelos ML
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Guia de deploy no Railway

## 🔧 Troubleshooting

### Erro: "Serviço de ML indisponível"
- Verifique se o serviço de ML está rodando: `curl https://aimodel-teste-deploy.up.railway.app/health`
- Verifique se a variável `ML_SERVICE_URL` está configurada corretamente
- Para desenvolvimento local, certifique-se de que o serviço ML está rodando na porta 5000

### Erro: "Timeout ao processar predição"
- O serviço de ML pode estar sobrecarregado
- Verifique os logs do serviço de ML
- Aumente o timeout se necessário (padrão: 5 segundos)

### Erro: "@prisma/client" não encontrado
- Execute: `npm run prisma:generate`

### Erro: "Environment variable not found: DATABASE_URL"
- Crie um arquivo `.env` na raiz do diretório `backend`
- Adicione a variável `DATABASE_URL` com a URL de conexão do seu banco PostgreSQL
- Formato: `postgresql://usuario:senha@host:porta/database`
- Reinicie o servidor após criar o arquivo `.env`
