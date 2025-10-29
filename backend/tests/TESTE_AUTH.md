# 🧪 Guia de Teste - Sistema de Autenticação JWT

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **PostgreSQL** rodando
3. **Dependências instaladas**

## 🚀 Como Rodar o Backend

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta `backend`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/academic_management"
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=1h
```

### 3. Executar Migrações do Banco
```bash
npx prisma migrate dev
```

### 4. Iniciar o Servidor
```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

## 🧪 Como Testar a Autenticação

### Opção 1: Usando o Script de Teste Automático

```bash
# No terminal, na pasta backend
node test_auth.js
```

### Opção 2: Teste Manual com cURL

#### 1. Registrar um Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "teste@example.com",
    "PasswordHash": "123456",
    "name": "Usuário Teste",
    "Role": "STUDENT"
  }'
```

#### 2. Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "teste@example.com",
    "password": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "user": {
    "IDUser": "uuid-do-usuario",
    "Email": "teste@example.com",
    "Role": "STUDENT",
    "name": "Usuário Teste",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

#### 3. Testar Acesso com Token
```bash
# Substitua TOKEN_AQUI pelo token retornado no login
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN_AQUI"
```

#### 4. Testar Acesso sem Token (deve falhar)
```bash
curl -X GET http://localhost:3000/api/users
```

**Resposta esperada:**
```json
{
  "error": "Token de acesso requerido"
}
```

### Opção 3: Usando Postman/Insomnia

#### Configuração do Postman:

1. **Criar Collection** para "ABP Auth Tests"

2. **Request 1: Register**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
   ```json
   {
     "Email": "teste@example.com",
     "PasswordHash": "123456",
     "name": "Usuário Teste",
     "Role": "STUDENT"
   }
   ```

3. **Request 2: Login**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
   ```json
   {
     "Email": "teste@example.com",
     "password": "123456"
   }
   ```

4. **Request 3: Get Me (com Token)**
   - Method: `GET`
   - URL: `http://localhost:3000/api/auth/me`
   - Headers:
     ```
     Authorization: Bearer {{token}}
     ```
   - **Variável de Ambiente**: Crie uma variável `token` e copie o token do response do login

5. **Request 4: Get Users (sem Token - deve falhar)**
   - Method: `GET`
   - URL: `http://localhost:3000/api/users`

## 🔍 Testes de Validação

### ✅ Testes que DEVEM PASSAR:

1. **Login com credenciais válidas** → Retorna token
2. **Login com credenciais inválidas** → Retorna 401
3. **Acesso com token válido** → Permite acesso
4. **Acesso sem token** → Retorna 401
5. **Acesso com token inválido** → Retorna 401
6. **Acesso com token expirado** → Retorna 401
7. **Endpoint /auth/me** → Retorna dados do usuário

### ❌ Testes que DEVEM FALHAR:

1. **Acesso a rotas protegidas sem token**
2. **Acesso com token malformado**
3. **Login com email inexistente**
4. **Login com senha incorreta**

## 🎯 Cenários de Teste por Role

### STUDENT
```bash
# Login como estudante
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email": "student@test.com", "password": "123456"}'

# Tentar acessar lista de usuários (deve falhar - apenas ADMIN)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN_AQUI"
```

### TEACHER
```bash
# Login como professor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email": "teacher@test.com", "password": "123456"}'

# Acessar lista de alunos (deve funcionar)
curl -X GET http://localhost:3000/api/alunos \
  -H "Authorization: Bearer TOKEN_AQUI"
```

### ADMIN
```bash
# Login como admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email": "admin@test.com", "password": "123456"}'

# Acessar lista de usuários (deve funcionar)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN_AQUI"
```

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Database connection failed"
- Verifique se o PostgreSQL está rodando
- Confirme a string de conexão no `.env`

### Erro: "Token inválido"
- Verifique se o JWT_SECRET está configurado
- Confirme se o token não expirou (1 hora)

### Erro: "Port 3000 already in use"
```bash
# Mude a porta no .env ou mate o processo
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

## 📊 Métricas de Performance

Para testar se está dentro das métricas de sucesso:

```bash
# Teste de tempo de resposta do login
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email": "teste@example.com", "password": "123456"}'
```

**Meta**: < 200ms para autenticação

## 🎉 Sucesso!

Se todos os testes passarem, o sistema de autenticação JWT está funcionando corretamente e pronto para uso em produção!
