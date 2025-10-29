# Integração com Serviço de ML - Predições Automáticas

## Visão Geral

Este documento descreve a implementação da integração automática entre o backend Express.js e o serviço de Machine Learning (FastAPI) para geração e persistência de predições acadêmicas.

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
ML_BASE_URL=http://localhost:5000
ML_TIMEOUT_MS=2000
```

- **ML_BASE_URL**: URL base do serviço FastAPI de ML
- **ML_TIMEOUT_MS**: Timeout em milissegundos para requisições ao serviço de ML (padrão: 2000ms)

## Endpoint de Predição com ML

### POST /api/v1/predictions/generate

Gera uma predição usando o serviço de ML e persiste automaticamente no banco de dados.

#### Autenticação

Requer token JWT e role de `TEACHER` ou `ADMIN`.

#### Request Body

**Para Predição de Evasão:**

```json
{
  "IDMatricula": "uuid-da-matricula",
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
}
```

**Para Predição de Desempenho:**

```json
{
  "IDMatricula": "uuid-da-matricula",
  "TipoPredicao": "DESEMPENHO",
  "dados": {
    "Hours_Studied": 6.0,
    "Previous_Scores": 85.0,
    "Sleep_Hours": 8.0,
    "Distance_from_Home": "Near",
    "Attendance": 95.0,
    "Gender": "Male",
    "Parental_Education_Level": "Bachelor's",
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
}
```

#### Responses

**201 Created - Sucesso:**

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

**400 Bad Request - Dados inválidos:**

```json
{
  "error": "Campos obrigatórios: IDMatricula, TipoPredicao e dados"
}
```

ou

```json
{
  "error": "TipoPredicao deve ser \"EVASAO\" ou \"DESEMPENHO\""
}
```

**404 Not Found - Matrícula não encontrada:**

```json
{
  "error": "Matrícula não encontrada"
}
```

**503 Service Unavailable - Serviço ML indisponível:**

```json
{
  "error": "Serviço de predição temporariamente indisponível"
}
```

**504 Gateway Timeout - Timeout:**

```json
{
  "error": "Timeout ao processar predição"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Erro interno do servidor"
}
```

## Fluxo de Funcionamento

1. **Validação de Entrada**: Verifica se todos os campos obrigatórios estão presentes
2. **Validação de Tipo**: Confirma que TipoPredicao é "EVASAO" ou "DESEMPENHO"
3. **Verificação de Matrícula**: Valida se o IDMatricula existe no banco de dados
4. **Chamada ao Serviço ML**: Envia os dados para o endpoint apropriado do FastAPI
5. **Tratamento de Erros**: Gerencia timeouts e indisponibilidade do serviço
6. **Persistência Automática**: Salva a predição no banco de dados PostgreSQL
7. **Resposta ao Cliente**: Retorna os dados da predição criada

## Implementação Técnica

### Funções Auxiliares

#### `callDropoutService(data: any): Promise<MLPredictionResponse>`

Faz requisição HTTP POST para `http://localhost:5000/predict/dropout` com os dados de entrada.

#### `callPerformanceService(data: any): Promise<MLPredictionResponse>`

Faz requisição HTTP POST para `http://localhost:5000/predict/performance` com os dados de entrada.

#### `savePrediction(IDMatricula, tipo, mlResponse, dadosEntrada)`

Persiste a predição no banco de dados usando Prisma Client, mapeando:
- **TipoPredicao**: "EVASAO" ou "DESEMPENHO"
- **Probabilidade**: Valor entre 0 e 1 retornado pelo ML
- **Classificacao**: String de classificação retornada pelo ML
- **Explicacao**: Explicação textual da predição
- **DadosEntrada**: JSON com os dados enviados ao ML
- **IDMatricula**: UUID da matrícula vinculada

### Tratamento de Erros

- **ECONNABORTED/ETIMEDOUT**: Timeout de 2 segundos excedido
- **ECONNREFUSED**: Serviço de ML não está rodando ou inacessível
- **Erros de validação**: Dados inválidos ou matrícula inexistente

## Exemplo de Uso com cURL

```bash
curl -X POST http://localhost:3000/api/v1/predictions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "IDMatricula": "uuid-da-matricula",
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

## Endpoints Existentes (CRUD Manual)

Os endpoints de CRUD manual continuam funcionando normalmente:

- **GET /api/v1/predictions**: Lista todas as predições
- **GET /api/v1/predictions/:id**: Busca predição por ID
- **POST /api/v1/predictions**: Cria predição manualmente (sem ML)
- **PUT /api/v1/predictions/:id**: Atualiza predição
- **DELETE /api/v1/predictions/:id**: Deleta predição
- **GET /api/v1/predictions/matricula/:matriculaId**: Busca por matrícula
- **GET /api/v1/predictions/tipo/:tipo**: Busca por tipo

## Requisitos

- Serviço FastAPI rodando em `http://localhost:5000`
- PostgreSQL com schema Prisma atualizado
- Axios instalado (`npm install axios`)
- Variáveis de ambiente configuradas

## Observações

- A predição é persistida automaticamente após ser gerada pelo ML
- Não é necessário fazer uma segunda requisição para salvar
- O timeout padrão é de 2 segundos conforme especificação técnica
- Todas as predições são vinculadas a uma matrícula existente
- Os dados de entrada são armazenados em formato JSON para auditoria
