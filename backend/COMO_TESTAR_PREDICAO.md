# Como Testar a Predição de Evasão

Como o Thunder Client não funciona na versão gratuita do Cursor IDE, criamos um script Node.js para testar a funcionalidade diretamente no terminal.

## 📋 Pré-requisitos

1. **Backend rodando**: `npm run dev` (na pasta `backend`)
2. **Serviço FastAPI rodando**: Certifique-se de que o serviço de ML está rodando na porta 5000
3. **Banco de dados**: Ter pelo menos um usuário aluno cadastrado com matrícula

## 🚀 Como Usar

### Passo 1: Editar as Credenciais

Abra o arquivo `backend/test-predicao-evasao.js` e edite as linhas 15-16:

```javascript
const LOGIN_EMAIL = 'aluno@example.com';  // ⚠️ ALTERE AQUI
const LOGIN_PASSWORD = 'senha123';        // ⚠️ ALTERE AQUI
```

Coloque o email e senha de um usuário aluno que existe no seu banco de dados.

### Passo 2: Executar o Script

No terminal, dentro da pasta `backend`, execute:

```bash
node test-predicao-evasao.js
```

## 📊 O que o Script Testa

O script executa os seguintes testes automaticamente:

1. ✅ **Login** - Autentica e obtém o token
2. ✅ **Obter Dados do Usuário** - Busca informações do aluno
3. ✅ **Buscar Matrículas** - Lista as matrículas do aluno
4. ✅ **Verificar Serviço de ML** - Checa se o FastAPI está rodando
5. ✅ **Predição - Baixo Risco** - Testa com dados de alto engajamento
6. ✅ **Predição - Médio Risco** - Testa com dados de médio engajamento
7. ✅ **Predição - Alto Risco** - Testa com dados de baixo engajamento
8. ✅ **Buscar Predições Salvas** - Lista todas as predições da matrícula
9. ✅ **Testar Erro** - Verifica tratamento de dados inválidos

## 📝 Exemplo de Saída

```
🚀 Iniciando testes de Predição de Evasão...

============================================================
  TESTE 1: Login
============================================================

✅ Login realizado com sucesso!
{
  "user": {
    "IDUser": "...",
    "Email": "aluno@example.com",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

============================================================
  TESTE 5: Predição - Aluno com Baixo Risco
============================================================

✅ Predição gerada com sucesso!

📊 Resultado:
   Probabilidade de Evasão: 15.3%
   Classificação: Dropout
   Explicação: ...
```

## 🔧 Solução de Problemas

### Erro: "Serviço de ML não está disponível"
- Certifique-se de que o FastAPI está rodando na porta 5000
- Verifique se você está na pasta correta do projeto `ai_model` e executou o servidor

### Erro: "Credenciais inválidas"
- Verifique se o email e senha estão corretos no arquivo
- Certifique-se de que o usuário existe no banco de dados

### Erro: "Nenhuma matrícula encontrada"
- O aluno precisa ter pelo menos uma matrícula cadastrada
- Verifique no banco de dados se há matrículas para esse aluno

### Erro: "Cannot find module 'axios'"
- Execute: `npm install` na pasta `backend`

## 🎯 Testes Manuais (Alternativa)

Se preferir testar manualmente, você pode usar o `curl` no terminal:

### 1. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email":"aluno@example.com","password":"senha123"}'
```

### 2. Obter Dados (substitua {token})
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer {token}"
```

### 3. Gerar Predição (substitua {token} e {matricula-id})
```bash
curl -X POST http://localhost:8080/api/predictions/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "IDMatricula": "{matricula-id}",
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
  }'
```

## 📚 Mais Informações

Para mais detalhes sobre os endpoints e formatos de dados, consulte o arquivo `TESTE_PREDICAO_EVASAO.md` na raiz do projeto.

