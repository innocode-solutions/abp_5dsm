@echo off
echo 🚀 Configurando ambiente para testes de autenticação...

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não está instalado. Instale Node.js v18+ primeiro.
    pause
    exit /b 1
)

REM Verificar se npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não está instalado.
    pause
    exit /b 1
)

echo ✅ Node.js e npm encontrados

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
) else (
    echo ✅ Dependências já instaladas
)

REM Verificar se arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado. Criando template...
    (
        echo DATABASE_URL="postgresql://username:password@localhost:5432/academic_management"
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao
        echo JWT_EXPIRES_IN=1h
    ) > .env
    echo 📝 Arquivo .env criado. Configure as variáveis antes de continuar.
    echo    Especialmente a DATABASE_URL com suas credenciais do PostgreSQL.
    pause
    exit /b 1
)

echo ✅ Arquivo .env encontrado

REM Verificar se Prisma está configurado
if not exist "prisma\schema.prisma" (
    echo ❌ Schema do Prisma não encontrado.
    pause
    exit /b 1
)

echo ✅ Schema do Prisma encontrado

REM Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npx prisma generate

REM Executar migrações
echo 🗄️  Executando migrações do banco de dados...
npx prisma migrate dev

echo.
echo 🎉 Setup concluído!
echo.
echo 📋 Próximos passos:
echo 1. Inicie o servidor: npm run dev
echo 2. Em outro terminal, execute os testes: node test_auth_complete.js
echo.
echo 📖 Para mais detalhes, consulte: TESTE_AUTH.md
pause
