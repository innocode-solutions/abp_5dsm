@echo off
echo 🗄️ Configurando banco de dados PostgreSQL...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker encontrado. Iniciando PostgreSQL...
    
    REM Parar containers existentes
    docker-compose down >nul 2>&1
    
    REM Iniciar PostgreSQL
    docker-compose up -d
    
    echo ⏳ Aguardando PostgreSQL inicializar...
    timeout /t 10
    
    REM Verificar se está rodando
    docker-compose ps | findstr "Up" >nul
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL iniciado com sucesso!
    ) else (
        echo ❌ Erro ao iniciar PostgreSQL
        docker-compose logs postgres
        pause
        exit /b 1
    )
) else (
    echo ❌ Docker não encontrado.
    echo.
    echo 📋 Opções alternativas:
    echo 1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop
    echo 2. Configure PostgreSQL manualmente (consulte SETUP_DATABASE.md)
    echo 3. Use um banco online (Neon, Supabase, etc.)
    echo.
    pause
    exit /b 1
)

REM Criar arquivo .env se não existir
if not exist ".env" (
    echo 📝 Criando arquivo .env...
    (
        echo DATABASE_URL="postgresql://abp_user:abp_password@localhost:5432/academic_management"
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao
        echo JWT_EXPIRES_IN=1h
    ) > .env
    echo ✅ Arquivo .env criado com configurações do Docker
) else (
    echo ✅ Arquivo .env já existe
)

REM Executar migrações
echo 🔧 Executando migrações do Prisma...
npx prisma migrate dev

if %errorlevel% equ 0 (
    echo 🎉 Banco de dados configurado com sucesso!
    echo.
    echo 📋 Próximos passos:
    echo 1. Inicie o servidor: npm run dev
    echo 2. Execute os testes: node test_auth_complete.js
    echo 3. Acesse o Prisma Studio: npx prisma studio
) else (
    echo ❌ Erro ao executar migrações
    echo Verifique se o PostgreSQL está rodando corretamente
)

echo.
echo 💡 Para parar o banco: docker-compose down
echo 💡 Para ver logs: docker-compose logs postgres
pause
