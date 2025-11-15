# ✅ SMTP Setup Checklist

## 📋 Antes de Começar

- [ ] Node.js instalado
- [ ] Backend clonado e `npm install` executado
- [ ] Banco de dados PostgreSQL conectado
- [ ] `.env` com `DATABASE_URL`

---

## 🚀 Setup Gmail (5 minutos)

### Passo 1: Criar/Acessar Conta Google
- [ ] Visite: https://accounts.google.com
- [ ] Crie uma conta ou faça login com existente

### Passo 2: Ativar Verificação em 2 Etapas
- [ ] Acesse: https://myaccount.google.com/security
- [ ] Procure por "Verificação em 2 etapas"
- [ ] Clique em "Ativar"
- [ ] Siga as instruções (SMS ou app authenticator)

### Passo 3: Gerar App Password
- [ ] Acesse: https://myaccount.google.com/apppasswords
- [ ] Selecione:
  - [ ] App: **Mail**
  - [ ] Device: **Windows** (ou seu SO)
- [ ] Clique em "Gerar"
- [ ] **Copie a senha de 16 caracteres** (com espaços)

### Passo 4: Configurar `.env`
```bash
cd backend
# Abra o arquivo .env
```

Procure pela seção SMTP e preencha:
```env
SMTP_HOST=smtp.gmail.com          # ✅ Já preenchido
SMTP_PORT=587                     # ✅ Já preenchido
SMTP_SECURE=false                 # ✅ Já preenchido
SMTP_USER=seu-email@gmail.com     # ✅ Cole seu e-mail aqui
SMTP_PASS=abcd efgh ijkl mnop     # ✅ Cole a App Password aqui
OTP_EMAIL_FROM=seu-email@gmail.com # ✅ Cole seu e-mail aqui
```

- [ ] SMTP_USER preenchido
- [ ] SMTP_PASS preenchido (senha de 16 caracteres)
- [ ] OTP_EMAIL_FROM preenchido
- [ ] Arquivo `.env` salvo

---

## 🧪 Testar Configuração

### Passo 5: Validar SMTP
```bash
cd backend
node test-smtp.js
```

Resultado esperado:
```
✅ Variáveis de ambiente configuradas:
✅ Conexão SMTP estabelecida com sucesso!
```

- [ ] Script test-smtp.js executado sem erros

---

## 🎯 Testar Fluxo Completo

### Passo 6: Iniciar Backend
```bash
cd backend
npm run dev
```

Você verá algo como:
```
✓ Server running at http://localhost:3000
```

- [ ] Backend iniciado com sucesso

### Passo 7: Registrar Usuário de Teste
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "seu-email-teste@gmail.com",
    "PasswordHash": "SenhaTesteSegura123!",
    "name": "Teste SMTP"
  }'
```

- [ ] Usuário criado com sucesso

### Passo 8: Solicitar Código de Recuperação
```bash
curl -X POST http://localhost:3000/api/auth/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"Email": "seu-email-teste@gmail.com"}'
```

Response esperado:
```json
{"message": "Código enviado se o e-mail for válido"}
```

- [ ] Requisição OK (200)

### Passo 9: Verificar E-mail Recebido
- [ ] Abra sua caixa de entrada Gmail
- [ ] Procure por um e-mail de "no-reply@example.com"
- [ ] Copie o código de 6 dígitos

**Se não receber:**
- Verifique a pasta **Spam**
- Aguarde até 5 minutos
- Verifique que SMTP_USER e SMTP_PASS estão corretos

### Passo 10: Testar no App Mobile
1. [ ] Abra o app React Native
2. [ ] Clique em "Esqueci minha senha"
3. [ ] Insira seu e-mail de teste
4. [ ] Receba o código
5. [ ] Digite o código
6. [ ] Insira nova senha
7. [ ] Verifique sucesso

---

## 🎓 Usar com Frontend Mobile

Se tudo passou no checklist acima:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run start
```

1. [ ] Abra o app no simulador
2. [ ] Clique "Esqueci minha senha"
3. [ ] E-mail recebido com sucesso
4. [ ] Fluxo completo funcionando

---

## 📞 Troubleshooting

### Erro: "Authentication failed"
- [ ] Verifique se SMTP_USER está correto
- [ ] **Não use sua senha normal**, use App Password
- [ ] Regenere a App Password em https://myaccount.google.com/apppasswords

### Erro: "Connection refused"
- [ ] Verifique SMTP_HOST: `smtp.gmail.com` (com acento grave)
- [ ] Verifique SMTP_PORT: `587` (não 25)
- [ ] Seu firewall pode estar bloqueando

### E-mail não chega
- [ ] Aguarde 5 minutos (SMTP é lento)
- [ ] Verifique spam
- [ ] Use `node test-smtp.js` para validar

### Teste-smtp.js falha
- [ ] Instale dependências: `npm install`
- [ ] Verifique todas as variáveis no `.env`
- [ ] Execute: `npm install dotenv` se necessário

---

## 📚 Documentação

- `backend/SMTP_SETUP.md` - Guia completo
- `backend/README.md` - Seção SMTP
- `SMTP_CONFIGURATION_SUMMARY.md` - Resumo geral

---

## ✨ Pronto!

Após completar todo o checklist, seu sistema de recuperação de senha estará totalmente funcional! 🎉

Se tiver dúvidas, consulte a documentação ou reinicie do Passo 1.

---

**Última alteração:** `$(date)`
**Status:** ✅ Pronto para produção
