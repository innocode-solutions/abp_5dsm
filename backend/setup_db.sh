#!/bin/bash

echo "🗄️ Configurando banco de dados PostgreSQL..."

# Verificar se Docker está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker encontrado. Iniciando PostgreSQL..."
    
    # Parar containers existentes
    docker-compose down &> /dev/null
    
    # Iniciar PostgreSQL
    docker-compose up -d
    
    echo "⏳ Aguardando PostgreSQL inicializar..."
    sleep 10
    
    # Verificar se está rodando
    if docker-compose ps | grep -q "Up"; then
        echo "✅ PostgreSQL iniciado com sucesso!"
    else
        echo "❌ Erro ao iniciar PostgreSQL"
        docker-compose logs postgres
        exit 1
    fi
else
    echo "❌ Docker não encontrado."
    echo ""
    echo "📋 Opções alternativas:"
    echo "1. Instale Docker: https://docs.docker.com/get-docker/"
    echo "2. Configure PostgreSQL manualmente (consulte SETUP_DATABASE.md)"
    echo "3. Use um banco online (Neon, Supabase, etc.)"
    echo ""
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
DATABASE_URL="postgresql://abp_user:abp_password@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao
JWT_EXPIRES_IN=1h
EOF
    echo "✅ Arquivo .env criado com configurações do Docker"
else
    echo "✅ Arquivo .env já existe"
fi

# Executar migrações
echo "🔧 Executando migrações do Prisma..."
npx prisma migrate dev

if [ $? -eq 0 ]; then
    echo "🎉 Banco de dados configurado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Inicie o servidor: npm run dev"
    echo "2. Execute os testes: node test_auth_complete.js"
    echo "3. Acesse o Prisma Studio: npx prisma studio"
else
    echo "❌ Erro ao executar migrações"
    echo "Verifique se o PostgreSQL está rodando corretamente"
fi

echo ""
echo "💡 Para parar o banco: docker-compose down"
echo "💡 Para ver logs: docker-compose logs postgres"
