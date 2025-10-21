# 🚀 Como Rodar o AI Model Localmente

## ✅ Método Mais Simples (Windows)

### 1. Abrir Terminal no diretório ai_model
```bash
cd ai_model
```

### 2. Ativar ambiente virtual
```bash
venv\Scripts\activate
```

### 3. Iniciar o serviço
```bash
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
```

### 4. Testar se está funcionando
- Abrir navegador: http://localhost:5000/docs
- Ou testar: http://localhost:5000/health

## 🔧 Se der erro

### Erro: "Módulo não encontrado"
```bash
# Reinstalar dependências
pip install -r requirements.txt
```

### Erro: "Porta 5000 em uso"
```bash
# Matar processo na porta 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Erro: "Python não encontrado"
- Instalar Python 3.11+ do site oficial
- Marcar "Add to PATH" durante instalação

## 🧪 Testando o Serviço

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Documentação
Abrir: http://localhost:5000/docs

### 3. Teste de Predição
```bash
curl -X POST "http://localhost:5000/predict/dropout" ^
  -H "Content-Type: application/json" ^
  -d "{\"raisedhands\": 25, \"VisITedResources\": 50, \"AnnouncementsView\": 10, \"Discussion\": 15, \"ParentAnsweringSurvey\": \"Yes\", \"ParentschoolSatisfaction\": \"Good\", \"StudentAbsenceDays\": \"Under-7\"}"
```

## 📊 Status do Serviço

### ✅ Funcionando
- Servidor rodando na porta 5000
- API docs acessível
- Health check OK

### ❌ Problemas
- Verificar logs no terminal
- Verificar se porta está livre
- Verificar dependências instaladas

## 🎯 Integração com Backend

Quando o AI Model estiver rodando:

1. **Backend** (porta 3000): http://localhost:3000
2. **AI Model** (porta 5000): http://localhost:5000

O backend se conecta automaticamente ao AI Model na porta 5000.

## 🛑 Parar o Serviço

No terminal onde está rodando:
```
Ctrl + C
```

## 📝 Logs

Para ver logs detalhados:
```bash
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload --log-level debug
```

## ✅ Checklist Final

- [ ] Python 3.11+ instalado
- [ ] Ambiente virtual ativado
- [ ] Dependências instaladas
- [ ] Serviço iniciado
- [ ] Porta 5000 acessível
- [ ] API docs funcionando
- [ ] Health check OK

Se todos os itens estão marcados, o AI Model está funcionando! 🎉
