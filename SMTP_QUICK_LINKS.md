# 🎯 Links Diretos - SMTP Gratuito

## 📋 Copie e Cole

### Mailtrap (2 min) ⚡
```
Cadastro: https://mailtrap.io/
Depois de logar → Sending → SMTP Settings
Copie User e Password
```

**Config do `.env`:**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<USER do Mailtrap>
SMTP_PASS=<PASSWORD do Mailtrap>
OTP_EMAIL_FROM=teste@seu-app.com
```

---

### Brevo (10 min) 🏆
```
Cadastro: https://www.brevo.com/pt/
Depois de logar → SMTP & API → Chaves SMTP
Copie User e Password
```

**Config do `.env`:**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<USER do Brevo>
SMTP_PASS=<PASSWORD do Brevo>
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

---

### SendGrid (10 min) 🏢
```
Cadastro: https://sendgrid.com/
Depois de logar → Settings → API Keys
Crie uma API Key
```

**Config do `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<sua-api-key>
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

---

## ✅ Próximo Passo

```bash
# 1. Escolha uma opção acima
# 2. Abra o link de cadastro
# 3. Copie as credenciais
# 4. Edite o arquivo: backend/.env
# 5. Cole as credenciais
# 6. Execute:

cd backend
node test-smtp.js

# Se passar, inicie o backend:
npm run dev
```

---

**Qual você quer usar? 🚀**
