# Guia de Teste - Integração ML

## Pré-requisitos

1. **Serviço FastAPI rodando** na porta 5000
2. **Backend Express** rodando na porta 3000
3. **PostgreSQL** com banco de dados configurado
4. **Token JWT válido** de um usuário com role TEACHER ou ADMIN
5. **ID de uma matrícula válida** no banco de dados

## Passo 1: Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
ML_BASE_URL=http://localhost:5000
ML_TIMEOUT_MS=2000
```

## Passo 2: Iniciar o Serviço de ML

No diretório `ai_model`:

```bash
cd ai_model
python -m uvicorn main:app --reload --port 5000
```

Ou se estiver usando um arquivo específico:

```bash
python -m uvicorn app:app --reload --port 5000
```

Verifique se o serviço está rodando acessando: http://localhost:5000/docs

## Passo 3: Iniciar o Backend

No diretório `backend`:

```bash
npm run dev
```

## Passo 4: Executar Testes Automatizados

### Teste Básico (apenas serviço ML)

```bash
node teste_ml_integration.js
```

Este teste verifica se o serviço de ML está respondendo corretamente.

### Teste Completo (com autenticação)

Primeiro, obtenha um token JWT fazendo login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professor@example.com",
    "senha": "senha123"
  }'
```

Depois, obtenha um ID de matrícula válido:

```bash
curl -X GET http://localhost:3000/api/v1/matriculas \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Execute o teste completo:

```bash
node teste_ml_integration.js "SEU_TOKEN_JWT" "ID_MATRICULA"
```

## Passo 5: Testes Manuais com cURL

### Teste 1: Predição de Evasão

```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
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

**Resposta Esperada (201):**

```json
{
  "success": true,
  "message": "Predição gerada e salva com sucesso",
  "data": {
    "IDPrediction": "uuid-gerado",
    "IDMatricula": "uuid-da-matricula",
    "TipoPredicao": "EVASAO",
    "Probabilidade": 0.15,
    "Classificacao": "Low",
    "Explicacao": "Baixo risco de evasão devido a alto engajamento e suporte familiar",
    "createdAt": "2025-01-26T10:30:00.000Z"
  }
}
```

### Teste 2: Predição de Desempenho

```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "IDMatricula": "ID_MATRICULA_VALIDO",
    "TipoPredicao": "DESEMPENHO",
    "dados": {
      "Hours_Studied": 6.0,
      "Previous_Scores": 85.0,
      "Sleep_Hours": 8.0,
      "Distance_from_Home": "Near",
      "Attendance": 95.0,
      "Gender": "Male",
      "Parental_Education_Level": "Bachelor'\''s",
      "Parental_Involvement": "High",
      "School_Type": "Public",
      "Peer_Influence": "Positive",
      "Extracurricular_Activities": "Yes",
      "Learning_Disabilities": "No",
      "Internet_Access": "Yes",
      "Access_to_Resources": "Good",
      "Teacher_Quality": "Good",
      "Family_Income": "High",
      "Motivation_Level": "High",
      "Tutoring_Sessions": "No",
      "Physical_Activity": "High"
    }
  }'
```

### Teste 3: Verificar Persistência no Banco

Após criar uma predição, verifique se foi salva:

```bash
curl -X GET http://localhost:3000/api/v1/predictions \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Ou busque por matrícula específica:

```bash
curl -X GET http://localhost:3000/api/v1/predictions/matricula/ID_MATRICULA \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Passo 6: Testes de Erro

### Teste com Matrícula Inexistente (404)

```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "IDMatricula": "00000000-0000-0000-0000-000000000000",
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

**Resposta Esperada:**

```json
{
  "error": "Matrícula não encontrada"
}
```

### Teste com Tipo Inválido (400)

```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "IDMatricula": "ID_MATRICULA_VALIDO",
    "TipoPredicao": "INVALIDO",
    "dados": {}
  }'
```

**Resposta Esperada:**

```json
{
  "error": "TipoPredicao deve ser \"EVASAO\" ou \"DESEMPENHO\""
}
```

### Teste com Serviço ML Desligado (503)

1. Desligue o serviço FastAPI
2. Tente criar uma predição
3. Deve retornar erro 503

```json
{
  "error": "Serviço de predição temporariamente indisponível"
}
```

## Passo 7: Verificar Logs

Monitore os logs do backend para ver as requisições:

```bash
# No terminal onde o backend está rodando
# Você verá logs como:
# POST /api/v1/predictions/generate 201
# Erro ao criar predição com ML: ...
```

## Checklist de Validação

- [ ] Serviço FastAPI está rodando na porta 5000
- [ ] Backend Express está rodando na porta 3000
- [ ] Variáveis de ambiente ML_BASE_URL e ML_TIMEOUT_MS estão configuradas
- [ ] Token JWT válido obtido
- [ ] ID de matrícula válido obtido
- [ ] Predição de evasão criada com sucesso (201)
- [ ] Predição de desempenho criada com sucesso (201)
- [ ] Predições aparecem no banco de dados
- [ ] Erro 404 para matrícula inexistente
- [ ] Erro 400 para tipo de predição inválido
- [ ] Erro 503 quando serviço ML está desligado
- [ ] Dados de entrada são salvos no campo DadosEntrada
- [ ] Probabilidade está entre 0 e 1
- [ ] Classificação e explicação são retornadas corretamente

## Troubleshooting

### Erro: "Serviço de predição temporariamente indisponível"

- Verifique se o serviço FastAPI está rodando
- Confirme a URL em ML_BASE_URL
- Teste diretamente: `curl http://localhost:5000/docs`

### Erro: "Timeout ao processar predição"

- Aumente o valor de ML_TIMEOUT_MS no .env
- Verifique a performance do serviço de ML

### Erro: "Matrícula não encontrada"

- Verifique se o ID da matrícula existe no banco
- Use o endpoint GET /api/v1/matriculas para listar IDs válidos

### Erro: "Unauthorized" ou "Forbidden"

- Verifique se o token JWT é válido
- Confirme que o usuário tem role TEACHER ou ADMIN
- Gere um novo token se necessário

## Próximos Passos

Após validar a integração:

1. Integre com o frontend para criar interface de predições
2. Adicione testes unitários e de integração
3. Configure monitoramento e alertas
4. Implemente cache para predições frequentes
5. Adicione rate limiting para proteger o serviço de ML
