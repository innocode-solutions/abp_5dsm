#!/bin/bash

# Script de setup para testes de autenticação
echo "🚀 Configurando ambiente para testes de autenticação..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale Node.js v18+ primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
else
    echo "✅ Dependências já instaladas"
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando template..."
    cat > .env << EOF
DATABASE_URL="postgresql://username:password@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao
JWT_EXPIRES_IN=1h
EOF
    echo "📝 Arquivo .env criado. Configure as variáveis antes de continuar."
    echo "   Especialmente a DATABASE_URL com suas credenciais do PostgreSQL."
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Verificar se Prisma está configurado
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Schema do Prisma não encontrado."
    exit 1
fi

echo "✅ Schema do Prisma encontrado"

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar migrações
echo "🗄️  Executando migrações do banco de dados..."
npx prisma migrate dev

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Inicie o servidor: npm run dev"
echo "2. Em outro terminal, execute os testes: node test_auth_complete.js"
echo ""
echo "📖 Para mais detalhes, consulte: TESTE_AUTH.md"
