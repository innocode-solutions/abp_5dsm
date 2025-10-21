#!/bin/bash

echo "🚀 Iniciando AI Model localmente..."

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python 3.11+ primeiro."
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "src/app.py" ]; then
    echo "❌ Execute este script no diretório ai_model"
    exit 1
fi

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -r requirements.txt

# Iniciar o serviço
echo "🚀 Iniciando serviço na porta 5000..."
echo "📍 Acesse: http://localhost:5000/docs"
echo "⏹️  Para parar: Ctrl+C"
echo

uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
