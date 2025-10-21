@echo off
echo 🚀 Iniciando AI Model localmente...

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Instale Python 3.11+ primeiro.
    pause
    exit /b 1
)

REM Verificar se estamos no diretório correto
if not exist "src\app.py" (
    echo ❌ Execute este script no diretório ai_model
    pause
    exit /b 1
)

REM Criar ambiente virtual se não existir
if not exist "venv" (
    echo 📦 Criando ambiente virtual...
    python -m venv venv
)

REM Ativar ambiente virtual
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate

REM Instalar dependências
echo 📥 Instalando dependências...
pip install -r requirements.txt

REM Iniciar o serviço
echo 🚀 Iniciando serviço na porta 5000...
echo 📍 Acesse: http://localhost:5000/docs
echo ⏹️  Para parar: Ctrl+C
echo.

uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload

pause
