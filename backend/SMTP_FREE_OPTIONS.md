# 📧 SMTP Gratuito para TODOS os E-mails - Guia Rápido

## 🎯 3 Opções Gratuitas (Escolha Uma)

### Opção 1️⃣: **Mailtrap** ⭐ RECOMENDADO (2 min setup)

**Melhor para:** Desenvolvimento e testes

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=seu-usuario-aqui
SMTP_PASS=sua-senha-aqui
OTP_EMAIL_FROM=teste@seu-app.com
```

#### Como configurar:
1. Cadastre-se: https://mailtrap.io/
2. Vá em: **Sending** → **SMTP Settings**
3. Copie o **User** e **Password**
4. Cole no `.env`

✅ **Vantagens:**
- Gratuito
- 500 e-mails/mês
- Interface visual para ver e-mails
- Sem App Password necessária
- Perfeito para testes

❌ **Desvantagem:**
- Não envia e-mails de verdade (apenas para teste)

---

### Opção 2️⃣: **Brevo** (10 min setup)

**Melhor para:** Produção com volume pequeno

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-chave-api-brevo
OTP_EMAIL_FROM=noreply@seu-dominio.com
```

#### Como configurar:
1. Cadastre-se: https://www.brevo.com/pt/
2. Vá em: **SMTP & API** → **Chaves SMTP**
3. Copie o **User** e **Password**
4. Cole no `.env`

✅ **Vantagens:**
- Gratuito (até 300 e-mails/dia)
- **9.000 e-mails/mês**
- Envia e-mails de verdade
- Dashboard completo

---

### Opção 3️⃣: **SendGrid** (10 min setup)

**Melhor para:** Produção profissional

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-chave-api-sendgrid
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

#### Como configurar:
1. Cadastre-se: https://sendgrid.com/
2. Vá em: **Settings** → **API Keys**
3. Crie uma nova key
4. Copie no `.env`

✅ **Vantagens:**
- Gratuito (100 e-mails/dia)
- Envia e-mails de verdade
- API poderosa

---

## 🚀 Quickstart - Comece Agora!

### Se você quer testar AGORA (Mailtrap):

```bash
# 1. Cadastre-se em: https://mailtrap.io/
# 2. Copie suas credenciais SMTP
# 3. Edite o backend/.env com as credenciais
# 4. Teste com:
cd backend
node test-smtp.js

# 5. Se conectar com sucesso, inicie o backend:
npm run dev

# 6. Teste via app mobile:
# Clique em "Esqueci minha senha"
# Você verá o e-mail no painel do Mailtrap
```

---

## 📊 Comparação Rápida

| SMTP | Setup | Gratuito | Limite/mês | Para Produção |
|------|-------|----------|-----------|---------------|
| **Mailtrap** | 2 min | ✅ Sim | 500 | ❌ Não (teste) |
| **Brevo** | 10 min | ✅ Sim | 9.000 | ✅ Sim |
| **SendGrid** | 10 min | ✅ Sim | 100 | ✅ Sim |
| **Gmail** | 15 min | ✅ Sim | Ilimitado | ✅ Sim |

---

## 🎯 Minha Recomendação

### Para HOJE (Testar Agora):
👉 **Use Mailtrap** - 2 minutos para funcionar!

### Para DEPOIS (Produção):
👉 **Use Brevo** - Mais e-mails grátis (9.000/mês)

### Para LONGO PRAZO (Profissional):
👉 **Use SendGrid** - Mais confiável

---

## ⚡ Setup Mailtrap (2 min)

### Passo 1: Cadastro
```
https://mailtrap.io/
```

### Passo 2: Copiar Credenciais
```
No dashboard → Sending → SMTP Settings
Copie os valores de User e Password
```

### Passo 3: Preencher `.env`
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=sua-credencial-aqui
SMTP_PASS=sua-credencial-aqui
OTP_EMAIL_FROM=teste@seu-app.com
```

### Passo 4: Testar
```bash
cd backend && node test-smtp.js
```

### Passo 5: Iniciar Backend
```bash
npm run dev
```

---

## ✅ Resultado Esperado

Após configurar Mailtrap corretamente, você verá:

```
✅ Variáveis de ambiente configuradas:
✅ Conectando ao servidor SMTP...
✅ Conexão SMTP estabelecida com sucesso!
```

---

## 📞 Próximas Etapas

1. **Escolher um SMTP** (recomendo Mailtrap para começar)
2. **Cadastrar e gerar credenciais**
3. **Preencher no `.env`**
4. **Testar com `node test-smtp.js`**
5. **Iniciar backend: `npm run dev`**
6. **Testar app mobile**

---

## 🎊 Pronto!

Escolha uma opção acima e você terá seu SMTP gratuito funcionando em minutos!

**Qual você quer usar?** Avise que vou guiar passo-a-passo! 🚀
