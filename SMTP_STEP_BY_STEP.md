# 🎬 SMTP Gratuito - Passo-a-Passo Rápido

## 🎯 Escolha Um (Recomendo Mailtrap)

---

## 📍 OPÇÃO 1: Mailtrap (2 min) ⭐

### Passo 1: Abra o Link
```
https://mailtrap.io/
```

### Passo 2: Clique em "Sign Up"
Preencha com seu e-mail e senha

### Passo 3: Após logar, clique em "Sending"
Você verá uma inbox de teste

### Passo 4: Clique em "SMTP Settings"
Você verá algo assim:

```
Host: smtp.mailtrap.io
Port: 2525
Username: abc123def456
Password: xyw789uvz012
```

### Passo 5: Copie Essas Informações

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=abc123def456      # ← Cole o Username
SMTP_PASS=xyw789uvz012      # ← Cole o Password
OTP_EMAIL_FROM=teste@seu-app.com
```

### Passo 6: Edite o Arquivo backend/.env

Abra em um editor:
```
c:\Users\Samuel\Desktop\abp_5dsm\backend\.env
```

Substitua:
```env
# ===== SMTP Configuration (Mailtrap - Gratuito) =====
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=abc123def456      # ← COLE AQUI
SMTP_PASS=xyw789uvz012      # ← COLE AQUI
OTP_EMAIL_FROM=teste@seu-app.com
```

### Passo 7: Teste

Abra PowerShell e execute:
```bash
cd c:\Users\Samuel\Desktop\abp_5dsm\backend
node test-smtp.js
```

Se ver:
```
✅ Conexão SMTP estabelecida com sucesso!
```

✅ **Pronto!**

### Passo 8: Inicie o Backend

```bash
npm run dev
```

### Passo 9: Teste no App

1. Abra o app mobile
2. Clique "Esqueci minha senha"
3. Insira um e-mail
4. Volte ao painel do Mailtrap
5. ✉️ Você verá o e-mail lá!

---

## 📍 OPÇÃO 2: Brevo (10 min)

### Passo 1: Abra o Link
```
https://www.brevo.com/pt/
```

### Passo 2: Clique em "Inscreva-se"
Preencha com seus dados

### Passo 3: Após logar, vá em "SMTP & API"

### Passo 4: Clique em "Chaves SMTP"

### Passo 5: Copie

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com   # ← Cole aqui
SMTP_PASS=sua-chave-brevo       # ← Cole aqui
OTP_EMAIL_FROM=noreply@seu-app.com
```

### Passo 6-9: Mesmo que Mailtrap acima

---

## 📍 OPÇÃO 3: SendGrid (10 min)

### Passo 1: Abra o Link
```
https://sendgrid.com/
```

### Passo 2: Clique em "Sign Up"

### Passo 3: Após logar, vá em "Settings"

### Passo 4: Clique em "API Keys"

### Passo 5: Clique em "Create API Key"

### Passo 6: Copie a Chave Gerada

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-chave-aqui    # ← Cole aqui
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

### Passo 7-9: Mesmo que Mailtrap acima

---

## ⚡ Resumo Rápido

```
1. Escolha: Mailtrap / Brevo / SendGrid
2. Cadastre-se (2-5 min)
3. Copie credenciais (1 min)
4. Cole no backend/.env (1 min)
5. Execute: node test-smtp.js (1 min)
6. Se passar, execute: npm run dev (1 min)
7. Teste no app mobile (2 min)

TOTAL: ~13 minutos até funcionar!
```

---

## ✅ Checklist

### Mailtrap
- [ ] Abrir https://mailtrap.io/
- [ ] Cadastrar
- [ ] Clicar em Sending → SMTP Settings
- [ ] Copiar Username e Password
- [ ] Cole em SMTP_USER e SMTP_PASS
- [ ] Testar: node test-smtp.js
- [ ] Iniciar backend: npm run dev
- [ ] Testar app mobile

### Brevo
- [ ] Abrir https://www.brevo.com/pt/
- [ ] Cadastrar
- [ ] Clicar em SMTP & API → Chaves SMTP
- [ ] Copiar User e Password
- [ ] Cole em SMTP_USER e SMTP_PASS
- [ ] Testar: node test-smtp.js
- [ ] Iniciar backend: npm run dev
- [ ] Testar app mobile

### SendGrid
- [ ] Abrir https://sendgrid.com/
- [ ] Cadastrar
- [ ] Clicar em Settings → API Keys
- [ ] Criar API Key e copiar
- [ ] Cole em SMTP_PASS (SMTP_USER=apikey)
- [ ] Testar: node test-smtp.js
- [ ] Iniciar backend: npm run dev
- [ ] Testar app mobile

---

## 🆘 Erros Comuns

### Erro: "Connection refused"
```
❌ Provavelmente credenciais erradas
✅ Revise se copiou certo do painel
✅ Não há espaços extras
```

### Erro: "Invalid credentials"
```
❌ Username ou Password errado
✅ Copie novamente do painel
✅ Sem espaços ou quebras de linha
```

### Erro: "Timeout"
```
❌ Firewall bloqueando porta
✅ Tente trocar porta (SendGrid usa 587)
✅ Reinicie o computador
```

---

## 🎉 Quando Funcionar

Você verá:
```
✅ Variáveis de ambiente configuradas:
   SMTP_HOST: smtp.mailtrap.io
   SMTP_PORT: 2525
   SMTP_USER: (seu usuario)

✅ Conectando ao servidor SMTP...
✅ Conexão SMTP estabelecida com sucesso!

📧 Próximos passos:
   1. Inicie o backend: npm run dev
   2. Teste o fluxo de recuperação de senha
   3. Verifique se o e-mail é recebido
```

---

## 📞 Qual Escolher?

- **Quer AGORA?** → Mailtrap (mais rápido)
- **Quer MAIS?** → Brevo (9000/mês)
- **Quer PRO?** → SendGrid (confiável)

---

**Pronto para começar? Escolha uma opção acima! 🚀**
