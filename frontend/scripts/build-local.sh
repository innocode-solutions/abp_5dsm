#!/bin/bash

# Script para build APK apontando para backend local
# Uso: ./scripts/build-local.sh [IP_LOCAL]

echo "🔍 Detectando IP local..."

# Detecta o IP local automaticamente
if [ -z "$1" ]; then
    # Linux/Mac
    if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
        LOCAL_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    # Windows (Git Bash)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        LOCAL_IP=$(ipconfig | grep -Eo 'IPv4.*: ([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | head -1)
    else
        echo "❌ Não foi possível detectar o IP automaticamente."
        echo "Por favor, forneça o IP manualmente:"
        echo "  ./scripts/build-local.sh 192.168.1.100"
        exit 1
    fi
else
    LOCAL_IP=$1
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Não foi possível detectar o IP local."
    echo "Por favor, forneça o IP manualmente:"
    echo "  ./scripts/build-local.sh 192.168.1.100"
    exit 1
fi

echo "✅ IP detectado: $LOCAL_IP"
echo ""
echo "📦 Configurando variáveis de ambiente no EAS..."
echo ""

# Configura o IP no EAS
eas secret:create --scope project --name EXPO_PUBLIC_MACHINE_IP --value "$LOCAL_IP" --type string --force

if [ $? -eq 0 ]; then
    echo "✅ IP configurado com sucesso!"
    echo ""
    echo "🚀 Iniciando build..."
    echo ""
    eas build --platform android --profile local
else
    echo "❌ Erro ao configurar o IP no EAS"
    exit 1
fi

