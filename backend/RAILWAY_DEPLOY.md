# 🚀 Deploy no Railway

Este guia explica como fazer deploy do backend no Railway.

## 📋 Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Repositório GitHub conectado ao Railway
3. Banco de dados PostgreSQL (pode ser criado no Railway)

## 🔧 Configuração

### 1. Estrutura do Projeto

O Railway vai procurar por um `Dockerfile` na raiz do diretório `backend`. O Dockerfile já está configurado e inclui:
- ✅ Node.js 18
- ✅ Python 3 com todas as dependências do `requirements.txt`
- ✅ Prisma migrations automáticas
- ✅ Scripts ML Python
- ✅ Modelos treinados

### 2. Variáveis de Ambiente no Railway

Configure as seguintes variáveis de ambiente no Railway:

#### Obrigatórias:
- `DATABASE_URL` - URL de conexão do PostgreSQL
  - **Como obter**: No Railway, vá em seu serviço PostgreSQL → Variables → `DATABASE_URL` (ou `POSTGRES_URL`)
  - **Formato**: `postgresql://usuario:senha@host:porta/database`
  - **Importante**: Se você criou o banco no Railway, a variável pode ser criada automaticamente. Caso contrário, copie a URL completa do banco.
- `JWT_SECRET` - Chave secreta para JWT (gere uma string aleatória segura)
  - **Como gerar**: Use `openssl rand -base64 32` ou qualquer gerador de string aleatória
- `NODE_ENV` - `production`

#### Opcionais (com valores padrão):
- `PORT` - Porta do servidor (Railway define automaticamente, não precisa configurar)
- `HTTP_PORT` - Porta HTTP (padrão: 8080, mas Railway usa PORT)
- `FRONTEND_URL` - URL do frontend para CORS (ex: `https://seu-frontend.railway.app`)
- `JWT_EXPIRES_IN` - Tempo de expiração do JWT (padrão: `7d`)

### 3. Deploy

#### ⚠️ CONFIGURAÇÃO CRÍTICA: Root Directory

**ANTES DE FAZER O DEPLOY**, você DEVE configurar o Root Directory:

1. No Railway Dashboard, vá em seu serviço backend
2. Clique em **Settings** (ou ⚙️)
3. Role até a seção **Build**
4. Em **Root Directory**, digite: `backend`
5. Clique em **Save**

**Por que isso é importante?**
- Sem o Root Directory correto, o Railway tenta fazer build na raiz do projeto
- O Dockerfile não encontra o diretório `prisma` e o build falha
- O erro será: `"/prisma": not found`

#### Opção A: Deploy Automático via GitHub

1. No Railway, crie um novo projeto
2. Conecte seu repositório GitHub
3. **Configure o Root Directory para `backend`** ⚠️ **OBRIGATÓRIO**
4. O Railway vai usar o `Dockerfile` (configurado via `railway.json`)
5. Configure as variáveis de ambiente (veja seção abaixo)
6. O deploy será feito automaticamente a cada push

**⚠️ Se o Railway tentar usar Railpack/Nixpacks:**
- Verifique se o **Root Directory** está configurado como `backend`
- O arquivo `railway.json` força o uso do Dockerfile
- Se ainda assim usar Railpack, vá em Settings → Build → Builder → selecione "Dockerfile"

#### Opção B: Deploy Manual

1. No Railway, crie um novo projeto
2. Escolha "Deploy from GitHub repo"
3. Selecione seu repositório
4. Configure o **Root Directory** para `backend`
5. Configure as variáveis de ambiente
6. Clique em "Deploy"

## 🔍 Verificação

Após o deploy, verifique:

1. **Health Check**: `https://seu-app.railway.app/health`
2. **Database Health**: `https://seu-app.railway.app/health/db`
3. **ML Health**: `https://seu-app.railway.app/health/ml`

## 📝 Notas Importantes

- O Railway define automaticamente a variável `PORT` - o servidor está configurado para usar ela
- As migrations do Prisma rodam automaticamente antes de iniciar o servidor
- Python e todas as dependências ML são instaladas durante o build
- O servidor usa HTTP (não HTTPS) - o Railway gerencia HTTPS automaticamente

## 🐛 Troubleshooting

### Erro: "Python não encontrado"
- Verifique se o Dockerfile está instalando Python corretamente
- Verifique os logs do build no Railway

### Erro: "Modelos ML não encontrados"
- Verifique se os arquivos `.pkl` estão sendo copiados no Dockerfile
- Verifique se o diretório `src/ml/pipelines` existe no repositório

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está configurada corretamente
- Verifique se o banco de dados está rodando no Railway

### Erro: "Port already in use"
- O Railway gerencia a porta automaticamente via `PORT`
- Não configure `PORT` manualmente, deixe o Railway definir

### Erro: "/prisma": not found
- **Causa**: Root Directory não está configurado como `backend`
- **Solução**: 
  1. Vá em Settings → Build
  2. Configure **Root Directory** como `backend`
  3. Salve e faça um novo deploy

