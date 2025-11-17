# Guia de Teste - Predição de Evasão

Este documento contém os exemplos de requisições JSON para testar a funcionalidade de predição de evasão no Thunder Client.

## Pré-requisitos

1. Backend rodando em `http://localhost:8080`
2. Serviço de ML (FastAPI) rodando em `http://localhost:5000`
3. Banco de dados configurado com pelo menos um aluno e uma matrícula

---

## 1. Login (Obter Token)

**Método:** `POST`  
**URL:** `http://localhost:8080/api/auth/login`  
**Headers:** `Content-Type: application/json`

### Request Body:
```json
{
  "Email": "aluno@example.com",
  "password": "senha123"
}
```

### Response Esperado:
```json
{
  "user": {
    "IDUser": "uuid-do-usuario",
    "Email": "aluno@example.com",
    "Role": "STUDENT",
    "name": "Nome do Aluno",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

**⚠️ IMPORTANTE:** Copie o `token` da resposta para usar nas próximas requisições!

---

## 2. Obter Dados do Usuário e Aluno

**Método:** `GET`  
**URL:** `http://localhost:8080/api/auth/me`  
**Headers:** 
```
Authorization: Bearer {seu-token-aqui}
Content-Type: application/json
```

### Response Esperado:
```json
{
  "IDUser": "uuid-do-usuario",
  "Email": "aluno@example.com",
  "Role": "STUDENT",
  "name": "Nome do Aluno",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "alunos": [
    {
      "IDAluno": "uuid-do-aluno",
      "Nome": "Nome do Aluno",
      "Semestre": 1,
      "curso": {
        "IDCurso": "uuid-do-curso",
        "NomeDoCurso": "Ciência da Computação"
      }
    }
  ]
}
```

**⚠️ IMPORTANTE:** Copie o `IDAluno` da resposta!

---

## 3. Buscar Matrículas do Aluno

**Método:** `GET`  
**URL:** `http://localhost:8080/api/matriculas/aluno/{IDAluno}`  
**Headers:** 
```
Authorization: Bearer {seu-token-aqui}
Content-Type: application/json
```

**Exemplo:** `http://localhost:8080/api/matriculas/aluno/uuid-do-aluno`

### Response Esperado:
```json
[
  {
    "IDMatricula": "uuid-da-matricula",
    "IDAluno": "uuid-do-aluno",
    "IDDisciplina": "uuid-da-disciplina",
    "IDPeriodo": "uuid-do-periodo",
    "Status": "ENROLLED",
    "NotaFinal": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "disciplina": {
      "IDDisciplina": "uuid-da-disciplina",
      "NomeDaDisciplina": "Algoritmos e Estruturas de Dados",
      "CodigoDaDisciplina": "CC101",
      "CargaHoraria": 60
    },
    "periodo": {
      "IDPeriodo": "uuid-do-periodo",
      "Nome": "2024.1",
      "DataInicio": "2024-01-01T00:00:00.000Z",
      "DataFim": "2024-06-30T00:00:00.000Z"
    }
  }
]
```

**⚠️ IMPORTANTE:** Copie o `IDMatricula` da resposta!

---

## 4. Gerar Predição de Evasão

**Método:** `POST`  
**URL:** `http://localhost:8080/api/predictions/generate`  
**Headers:** 
```
Authorization: Bearer {seu-token-aqui}
Content-Type: application/json
```

### Request Body:
```json
{
  "IDMatricula": "uuid-da-matricula",
  "TipoPredicao": "EVASAO",
  "dados": {
    "raisedhands": 15,
    "VisITedResources": 20,
    "AnnouncementsView": 10,
    "Discussion": 8,
    "ParentAnsweringSurvey": "Yes",
    "ParentschoolSatisfaction": "Good",
    "StudentAbsenceDays": "Under-7"
  }
}
```

### Exemplos de Dados de Engajamento:

#### Exemplo 1: Aluno com Baixo Risco de Evasão
```json
{
  "IDMatricula": "uuid-da-matricula",
  "TipoPredicao": "EVASAO",
  "dados": {
    "raisedhands": 30,
    "VisITedResources": 50,
    "AnnouncementsView": 25,
    "Discussion": 20,
    "ParentAnsweringSurvey": "Yes",
    "ParentschoolSatisfaction": "Good",
    "StudentAbsenceDays": "Under-7"
  }
}
```

#### Exemplo 2: Aluno com Médio Risco de Evasão
```json
{
  "IDMatricula": "uuid-da-matricula",
  "TipoPredicao": "EVASAO",
  "dados": {
    "raisedhands": 10,
    "VisITedResources": 15,
    "AnnouncementsView": 8,
    "Discussion": 5,
    "ParentAnsweringSurvey": "Yes",
    "ParentschoolSatisfaction": "Good",
    "StudentAbsenceDays": "Under-7"
  }
}
```

#### Exemplo 3: Aluno com Alto Risco de Evasão
```json
{
  "IDMatricula": "uuid-da-matricula",
  "TipoPredicao": "EVASAO",
  "dados": {
    "raisedhands": 2,
    "VisITedResources": 5,
    "AnnouncementsView": 1,
    "Discussion": 0,
    "ParentAnsweringSurvey": "No",
    "ParentschoolSatisfaction": "Bad",
    "StudentAbsenceDays": "Above-7"
  }
}
```

### Response Esperado (Sucesso):
```json
{
  "success": true,
  "message": "Predição gerada e salva com sucesso",
  "data": {
    "IDPrediction": "uuid-da-predicao",
    "IDMatricula": "uuid-da-matricula",
    "TipoPredicao": "EVASAO",
    "Probabilidade": 0.25,
    "Classificacao": "Dropout",
    "Explicacao": "Explicação detalhada da predição...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Response Esperado (Erro - API Indisponível):
```json
{
  "error": "Serviço de predição temporariamente indisponível"
}
```

### Response Esperado (Erro - Dados Inválidos):
```json
{
  "error": "Dados inválidos. Verifique os campos preenchidos."
}
```

---

## 5. Buscar Predições por Matrícula

**Método:** `GET`  
**URL:** `http://localhost:8080/api/predictions/matricula/{IDMatricula}`  
**Headers:** 
```
Authorization: Bearer {seu-token-aqui}
Content-Type: application/json
```

**Exemplo:** `http://localhost:8080/api/predictions/matricula/uuid-da-matricula`

### Response Esperado:
```json
[
  {
    "IDPrediction": "uuid-da-predicao",
    "IDMatricula": "uuid-da-matricula",
    "TipoPredicao": "EVASAO",
    "Probabilidade": 0.25,
    "Classificacao": "Dropout",
    "Explicacao": "Explicação detalhada...",
    "DadosEntrada": {
      "raisedhands": 15,
      "VisITedResources": 20,
      "AnnouncementsView": 10,
      "Discussion": 8,
      "ParentAnsweringSurvey": "Yes",
      "ParentschoolSatisfaction": "Good",
      "StudentAbsenceDays": "Under-7"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "matricula": {
      "IDMatricula": "uuid-da-matricula",
      "aluno": {
        "IDAluno": "uuid-do-aluno",
        "Nome": "Nome do Aluno"
      },
      "disciplina": {
        "IDDisciplina": "uuid-da-disciplina",
        "NomeDaDisciplina": "Algoritmos e Estruturas de Dados"
      }
    }
  }
]
```

---

## Validação dos Campos de Engajamento

### Campos Obrigatórios:
- `raisedhands`: número inteiro (≥ 0) - Quantidade de vezes que o aluno levantou a mão
- `VisITedResources`: número inteiro (≥ 0) - Quantidade de recursos visitados
- `AnnouncementsView`: número inteiro (≥ 0) - Quantidade de anúncios visualizados
- `Discussion`: número inteiro (≥ 0) - Participações em discussões
- `ParentAnsweringSurvey`: string - "Yes" ou "No"
- `ParentschoolSatisfaction`: string - "Good" ou "Bad"
- `StudentAbsenceDays`: string - "Under-7" ou "Above-7"

---

## Fluxo Completo de Teste

1. **Login** → Obter token
2. **GET /auth/me** → Obter IDAluno
3. **GET /matriculas/aluno/{IDAluno}** → Obter IDMatricula
4. **POST /predictions/generate** → Gerar predição
5. **GET /predictions/matricula/{IDMatricula}** → Verificar predições salvas

---

## Testando Erros

### Teste 1: API de ML Indisponível
- Desligue o serviço FastAPI (porta 5000)
- Tente gerar uma predição
- Deve retornar: `503 - Serviço de predição temporariamente indisponível`

### Teste 2: Dados Inválidos
- Envie dados com valores negativos ou tipos incorretos
- Deve retornar: `400 - Dados inválidos`

### Teste 3: Matrícula Não Encontrada
- Use um IDMatricula inválido
- Deve retornar: `404 - Matrícula não encontrada`

### Teste 4: Token Inválido/Expirado
- Use um token inválido ou remova o header Authorization
- Deve retornar: `401 - Não autorizado`

---

## Notas Importantes

✅ **Permissões:** O endpoint `/predictions/generate` permite acesso para `STUDENT`, `TEACHER` e `ADMIN`. Alunos podem gerar suas próprias predições.

⚠️ **Serviço de ML:** Certifique-se de que o serviço FastAPI está rodando na porta 5000 antes de testar a predição.

⚠️ **Formato dos Dados:** Os dados de engajamento devem seguir exatamente o formato esperado pelo modelo de ML. Os valores enum são case-sensitive.

