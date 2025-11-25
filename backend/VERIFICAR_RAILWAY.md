# 🔍 Como Verificar se o Backend no Railway está Apontando para o Banco Correto

## ✅ Checklist de Verificação

### 1. Verificar Variáveis de Ambiente no Railway

No Railway Dashboard, vá até seu serviço backend e verifique:

1. **Acesse**: Railway Dashboard → Seu Projeto → Serviço Backend → **Variables**
2. **Verifique se existe**:
   - `DATABASE_URL` - Deve apontar para o banco PostgreSQL do Railway
   - `JWT_SECRET` - Chave secreta para JWT
   - `NODE_ENV` - Deve ser `production`
   - `ML_SERVICE_URL` - URL do serviço de ML (opcional, tem padrão)

### 2. Verificar se o DATABASE_URL está Correto

O `DATABASE_URL` deve ter um dos seguintes formatos:

**Se o banco está no mesmo projeto Railway:**
```
postgresql://postgres:senha@postgres.railway.internal:5432/railway
```

**Se o banco está em outro serviço Railway:**
```
postgresql://postgres:senha@containers-us-west-XXX.railway.app:5432/railway
```

**Se o banco está externo:**
```
postgresql://usuario:senha@host:porta/database
```

### 3. Verificar Health Checks

Teste os seguintes endpoints:

```bash
# Health geral
curl https://abp5dsm-teste-deploy.up.railway.app/api/health

# Health do banco de dados
curl https://abp5dsm-teste-deploy.up.railway.app/api/health/db

# Health do ML service
curl https://abp5dsm-teste-deploy.up.railway.app/api/health/ml
```

### 4. Verificar Logs do Railway

No Railway Dashboard:
1. Vá em seu serviço backend
2. Clique em **Deployments** → Último deploy → **View Logs**
3. Procure por:
   - ✅ `Database migrations completed` - Migrations executadas com sucesso
   - ❌ `Can't reach database server` - Problema de conexão
   - ❌ `Environment variable not found: DATABASE_URL` - Variável não configurada

## 🔧 Como Corrigir Problemas

### Problema: DATABASE_URL não configurado

1. No Railway, vá em seu serviço PostgreSQL
2. Clique em **Variables**
3. Copie o valor de `DATABASE_URL` ou `POSTGRES_URL`
4. Vá em seu serviço Backend → **Variables**
5. Adicione/Edite `DATABASE_URL` com o valor copiado
6. Faça um novo deploy

### Problema: Banco de dados não acessível

1. Verifique se o serviço PostgreSQL está rodando no Railway
2. Verifique se o `DATABASE_URL` está usando o host correto:
   - Para banco no mesmo projeto: `postgres.railway.internal`
   - Para banco externo: use o host público

### Problema: Migrations não executadas

As migrations devem rodar automaticamente no deploy. Se não rodaram:

1. Verifique os logs do deploy
2. Procure por erros relacionados ao Prisma
3. Se necessário, conecte-se ao banco e execute manualmente:
   ```bash
   npx prisma migrate deploy
   ```

## 📝 Teste de Login

Para testar o login após verificar tudo:

```bash
curl -X POST https://abp5dsm-teste-deploy.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email":"aluno@dashboard.com","password":"123456"}'
```

Se retornar erro 500, verifique os logs do Railway para ver o erro específico.

