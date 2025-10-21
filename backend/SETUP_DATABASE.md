# 🗄️ Configuração do Banco de Dados PostgreSQL

## ❌ Erro Atual
```
Error: P1000: Authentication failed against database server, the provided database credentials for `username` are not valid.
```

## 🔧 Soluções

### Opção 1: Configurar PostgreSQL Local

#### 1. Instalar PostgreSQL
**Windows:**
- Baixe do site oficial: https://www.postgresql.org/download/windows/
- Durante a instalação, anote a senha do usuário `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### 2. Criar Banco de Dados
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE academic_management;

# Criar usuário (opcional)
CREATE USER abp_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE academic_management TO abp_user;

# Sair
\q
```

#### 3. Configurar .env
```env
DATABASE_URL="postgresql://postgres:sua_senha_aqui@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=1h
```

### Opção 2: Usar Docker (Recomendado)

#### 1. Criar docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: abp_postgres
    environment:
      POSTGRES_DB: academic_management
      POSTGRES_USER: abp_user
      POSTGRES_PASSWORD: abp_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 2. Iniciar PostgreSQL
```bash
docker-compose up -d
```

#### 3. Configurar .env
```env
DATABASE_URL="postgresql://abp_user:abp_password@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=1h
```

### Opção 3: Usar Banco Online (Neon, Supabase, etc.)

#### Neon (Gratuito):
1. Acesse: https://neon.tech/
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string
5. Configure no .env:
```env
DATABASE_URL="postgresql://usuario:senha@ep-xxx.us-east-1.aws.neon.tech/academic_management?sslmode=require"
```

## 🧪 Testar Conexão

### 1. Verificar se PostgreSQL está rodando
```bash
# Windows
netstat -an | findstr :5432

# Linux/Mac
netstat -an | grep :5432
```

### 2. Testar conexão com psql
```bash
psql -h localhost -U postgres -d academic_management
```

### 3. Executar migrações
```bash
npx prisma migrate dev
```

### 4. Verificar se funcionou
```bash
npx prisma studio
```

## 🚀 Script de Setup Rápido

Crie um arquivo `setup_db.bat` (Windows) ou `setup_db.sh` (Linux/Mac):

**Windows (setup_db.bat):**
```batch
@echo off
echo 🗄️ Configurando banco de dados...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker encontrado. Iniciando PostgreSQL...
    docker-compose up -d
    timeout /t 5
    echo ✅ PostgreSQL iniciado!
) else (
    echo ❌ Docker não encontrado. Configure PostgreSQL manualmente.
    echo 📖 Consulte SETUP_DATABASE.md para instruções.
    pause
    exit /b 1
)

REM Executar migrações
echo 🔧 Executando migrações...
npx prisma migrate dev

echo 🎉 Banco de dados configurado com sucesso!
pause
```

**Linux/Mac (setup_db.sh):**
```bash
#!/bin/bash
echo "🗄️ Configurando banco de dados..."

# Verificar se Docker está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker encontrado. Iniciando PostgreSQL..."
    docker-compose up -d
    sleep 5
    echo "✅ PostgreSQL iniciado!"
else
    echo "❌ Docker não encontrado. Configure PostgreSQL manualmente."
    echo "📖 Consulte SETUP_DATABASE.md para instruções."
    exit 1
fi

# Executar migrações
echo "🔧 Executando migrações..."
npx prisma migrate dev

echo "🎉 Banco de dados configurado com sucesso!"
```

## 🔍 Troubleshooting

### Erro: "database does not exist"
```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE academic_management;"
```

### Erro: "role does not exist"
```bash
# Criar usuário
psql -U postgres -c "CREATE USER abp_user WITH PASSWORD 'sua_senha';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE academic_management TO abp_user;"
```

### Erro: "connection refused"
- Verifique se PostgreSQL está rodando
- Confirme a porta (padrão: 5432)
- Verifique firewall/antivírus

### Erro: "password authentication failed"
- Verifique usuário e senha no .env
- Teste com psql primeiro
- Verifique se o usuário tem permissões

## 📋 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `academic_management` criado
- [ ] Usuário com permissões configurado
- [ ] Arquivo `.env` com DATABASE_URL correto
- [ ] Migrações executadas com sucesso
- [ ] `npx prisma studio` abre sem erros

## 🎯 Próximos Passos

Após configurar o banco:
1. Execute: `npm run dev`
2. Execute: `node test_auth_complete.js`
3. Teste a autenticação JWT
