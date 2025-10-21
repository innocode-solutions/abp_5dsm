# 🚀 Como Rodar o AI Model Localmente

Este guia te ajudará a configurar e executar o serviço de IA localmente.

## 📋 Pré-requisitos

- **Python 3.11+** instalado
- **pip** (gerenciador de pacotes Python)
- **Git** (para clonar o repositório)

## 🔧 Opção 1: Execução Direta (Recomendada)

### 1. Navegar para o diretório
```bash
cd ai_model
```

### 2. Criar ambiente virtual (Recomendado)
```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Executar o serviço
```bash
# Comando básico
uvicorn src.app:app --host 0.0.0.0 --port 5000

# Com reload automático (desenvolvimento)
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload

# Com logs detalhados
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload --log-level debug
```

### 5. Verificar se está funcionando
```bash
# Testar health check
curl http://localhost:5000/health

# Ou abrir no navegador
http://localhost:5000/docs
```

## 🐳 Opção 2: Docker (Alternativa)

### 1. Usando Docker Compose
```bash
cd ai_model
docker-compose up --build
```

### 2. Usando Docker diretamente
```bash
cd ai_model

# Construir a imagem
docker build -t ai-model-app .

# Executar o container
docker run -p 5000:5000 ai-model-app
```

## 🛠️ Scripts de Apoio

### Scripts Automáticos

#### Windows:
```bash
# Verificar sistema
python check_system.py

# Instalar dependências
python install_deps.py

# Iniciar serviço
start_local.bat
```

#### Linux/Mac:
```bash
# Verificar sistema
python3 check_system.py

# Instalar dependências
python3 install_deps.py

# Iniciar serviço
./start_local.sh
```

## 🔍 Verificação do Sistema

### 1. Verificar se está tudo OK
```bash
python check_system.py
```

Este script verifica:
- ✅ Versão do Python (3.11+)
- ✅ Arquivos necessários
- ✅ Dependências instaladas
- ✅ Modelos de IA
- ✅ Porta 5000 disponível

### 2. Instalar dependências automaticamente
```bash
python install_deps.py
```

Este script:
- ✅ Cria ambiente virtual
- ✅ Atualiza pip
- ✅ Instala todas as dependências

## 🚀 Execução Rápida

### Método 1: Scripts Automáticos
```bash
# Windows
start_local.bat

# Linux/Mac
./start_local.sh
```

### Método 2: Manual
```bash
# 1. Criar ambiente virtual
python -m venv venv

# 2. Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Executar
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
```

## 🧪 Testando o Serviço

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Documentação da API
Abra no navegador: http://localhost:5000/docs

### 3. Teste de Predição
```bash
# Predição de evasão
curl -X POST "http://localhost:5000/predict/dropout" \
  -H "Content-Type: application/json" \
  -d '{
    "raisedhands": 25,
    "VisITedResources": 50,
    "AnnouncementsView": 10,
    "Discussion": 15,
    "ParentAnsweringSurvey": "Yes",
    "ParentschoolSatisfaction": "Good",
    "StudentAbsenceDays": "Under-7"
  }'
```

## 🐳 Docker (Alternativa)

### Usando Docker Compose
```bash
docker-compose up --build
```

### Usando Docker diretamente
```bash
# Construir
docker build -t ai-model-app .

# Executar
docker run -p 5000:5000 ai-model-app
```

## ❌ Problemas Comuns

### 1. "Python não encontrado"
**Solução:** Instale Python 3.11+ do site oficial

### 2. "Porta 5000 em uso"
**Solução:** 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### 3. "Módulo não encontrado"
**Solução:**
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

### 4. "Modelos não encontrados"
**Solução:** Os modelos são gerados automaticamente. Se não existirem, o sistema usará dados de exemplo.

## 📊 Monitoramento

### Logs em Tempo Real
```bash
# Com logs detalhados
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload --log-level debug
```

### Verificar Status
```bash
# Health check
curl http://localhost:5000/health

# Informações da API
curl http://localhost:5000/
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```bash
# Definir porta personalizada
export PORT=8000
uvicorn src.app:app --host 0.0.0.0 --port $PORT

# Modo de desenvolvimento
export ENV=development
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
```

### Performance
```bash
# Múltiplos workers
uvicorn src.app:app --host 0.0.0.0 --port 5000 --workers 4
```

## ✅ Checklist de Funcionamento

- [ ] Python 3.11+ instalado
- [ ] Arquivos do projeto presentes
- [ ] Ambiente virtual criado
- [ ] Dependências instaladas
- [ ] Porta 5000 disponível
- [ ] Serviço iniciado
- [ ] Health check OK
- [ ] API docs acessível

Se todos os itens estão marcados, o AI Model está funcionando! 🎉
