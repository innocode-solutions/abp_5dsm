# 🚀 Quick Start - Integração ML

## ⚡ Início Rápido (5 minutos)

### 1. Configurar Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
ML_BASE_URL=http://localhost:5000
ML_TIMEOUT_MS=2000
```

### 2. Iniciar Serviços

**Terminal 1 - Serviço ML:**
```bash
cd ai_model
python -m uvicorn main:app --reload --port 5000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

### 3. Testar Integração

**Obter Token JWT:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "professor@example.com", "senha": "senha123"}'
```

**Criar Predição de Evasão:**
```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "IDMatricula": "ID_MATRICULA_VALIDO",
    "TipoPredicao": "EVASAO",
    "dados": {
      "raisedhands": 50,
      "VisITedResources": 30,
      "AnnouncementsView": 20,
      "Discussion": 15,
      "ParentAnsweringSurvey": "Yes",
      "ParentschoolSatisfaction": "Good",
      "StudentAbsenceDays": "Under-7"
    }
  }'
```

## 📚 Documentação Completa

- **ML_INTEGRATION.md** - Documentação técnica completa
- **TESTE_ML_INTEGRATION.md** - Guia de testes detalhado
- **ENV_CONFIG.md** - Configuração de variáveis de ambiente
- **IMPLEMENTACAO_RESUMO.md** - Resumo da implementação

## 🔗 Endpoints Disponíveis

### Novo Endpoint (com ML)
- `POST /api/v1/predictions/generate` - Gera predição usando ML e salva automaticamente

### Endpoints Existentes (CRUD)
- `GET /api/v1/predictions` - Lista todas as predições
- `GET /api/v1/predictions/:id` - Busca predição por ID
- `POST /api/v1/predictions` - Cria predição manualmente
- `PUT /api/v1/predictions/:id` - Atualiza predição
- `DELETE /api/v1/predictions/:id` - Deleta predição
- `GET /api/v1/predictions/matricula/:id` - Busca por matrícula
- `GET /api/v1/predictions/tipo/:tipo` - Busca por tipo

## ✅ Checklist Rápido

- [ ] Variáveis ML_BASE_URL e ML_TIMEOUT_MS configuradas
- [ ] Serviço FastAPI rodando na porta 5000
- [ ] Backend rodando na porta 3000
- [ ] Token JWT obtido
- [ ] ID de matrícula válido obtido
- [ ] Teste de predição executado com sucesso

## 🐛 Problemas Comuns

**Erro 503 - Serviço indisponível:**
- Verifique se o FastAPI está rodando: `curl http://localhost:5000/docs`

**Erro 404 - Matrícula não encontrada:**
- Liste matrículas válidas: `GET /api/v1/matriculas`

**Erro 401 - Não autorizado:**
- Gere novo token JWT fazendo login

## 📞 Suporte

Execute o teste automatizado:
```bash
node teste_ml_integration.js "SEU_TOKEN" "ID_MATRICULA"
```
