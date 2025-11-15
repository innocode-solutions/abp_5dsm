# 📧 Configuração SMTP para Recuperação de Senha

## ✅ Status Atual

O backend já possui:
- ✅ Serviço de e-mail implementado (`src/service/emailService.ts`)
- ✅ Controlador de autenticação com suporte a recuperação de senha
- ✅ Prisma com modelo `PasswordResetRequest`
- ✅ Nodemailer instalado

## 🚀 Setup Rápido (5 minutos)

### Opção 1: Gmail (Recomendado)

#### 1️⃣ Criar conta Google
```
https://accounts.google.com/signup
```

#### 2️⃣ Ativar Autenticação em 2 Etapas
1. Acesse: https://myaccount.google.com/security
2. Clique em "Verificação em 2 etapas"
3. Siga as instruções (via SMS ou app authenticator)

#### 3️⃣ Gerar App Password
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione:
   - **App:** Mail
   - **Device:** Windows (ou seu dispositivo)
3. Clique em "Gerar"
4. Copie a senha de 16 caracteres gerada

#### 4️⃣ Atualizar `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
OTP_EMAIL_FROM=seu-email@gmail.com
```

**Pronto! Salve o arquivo e reinicie o backend.**

---

### Opção 2: Brevo (Alternativa - 10 min)

#### 1️⃣ Cadastro
```
https://www.brevo.com/pt/
```

#### 2️⃣ Gerar Credenciais SMTP
1. Faça login
2. Vá em: **SMTP & API** → **Chaves SMTP**
3. Copie os valores

#### 3️⃣ Atualizar `.env`
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email-cadastro@gmail.com
SMTP_PASS=sua-chave-smtp-brevo
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

**Inclui 300 e-mails/dia gratuitos.**

---

### Opção 3: SendGrid (Profissional - 10 min)

#### 1️⃣ Cadastro
```
https://sendgrid.com/
```

#### 2️⃣ Gerar API Key
1. Faça login
2. Vá em: **Settings** → **API Keys**
3. Clique em "Create API Key"
4. Copie a chave

#### 3️⃣ Atualizar `.env`
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-sendgrid
OTP_EMAIL_FROM=seu-email@seu-dominio.com
```

**Inclui 100 e-mails/dia gratuitos.**

---

## 🧪 Testar o SMTP

### 1️⃣ Iniciar o Backend
```bash
cd backend
npm run dev
```

### 2️⃣ Criar um Usuário de Teste
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "seu-email@gmail.com",
    "PasswordHash": "Senha123!",
    "name": "Teste"
  }'
```

### 3️⃣ Solicitar Código de Recuperação
```bash
curl -X POST http://localhost:3000/api/auth/password/forgot \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "seu-email@gmail.com"
  }'
```

### 4️⃣ Verificar E-mail
Você deve receber um e-mail com o código de recuperação!

---

## 📊 Comparação de SMTP Gratuitos

| Provedor | Limite/mês | Setup | Recomendado |
|----------|-----------|-------|-------------|
| **Gmail** | Ilimitado | 5 min | ⭐ Agora |
| **Brevo** | 9.000 | 10 min | ⭐⭐ Depois |
| **SendGrid** | 100 | 10 min | ⭐⭐ Depois |

---

## ❌ Troubleshooting

### Erro: "Authentication failed"
- Verifique se as credenciais estão corretas no `.env`
- Se usar Gmail, certifique-se de usar **App Password** e não a senha normal

### Erro: "Connection refused"
- Verifique `SMTP_HOST` e `SMTP_PORT`
- Para Gmail: sempre use `smtp.gmail.com:587`

### Erro: "ECONNREFUSED"
- Seu firewall pode estar bloqueando a porta 587
- Teste com a porta 465 (segura) em vez de 587

### E-mail não chega
- Verificar pasta de spam
- Aguardar até 5 minutos (SMTP é lento)
- Se usar Gmail, verifique que a App Password foi gerada corretamente

---

## 📝 Variáveis de Ambiente

```env
# Host do servidor SMTP
SMTP_HOST=smtp.gmail.com

# Porta SMTP (geralmente 587 ou 465)
SMTP_PORT=587

# Se usar porta 465, ativar SSL/TLS
SMTP_SECURE=false

# Usuário/e-mail para autenticação
SMTP_USER=seu-email@gmail.com

# Senha ou App Password
SMTP_PASS=sua-app-password

# E-mail que aparecerá como "remetente"
OTP_EMAIL_FROM=seu-email@gmail.com
```

---

## ✅ Verificação Final

Após configurar, você verá no console do backend:

```
❌ Antes: "[emailService] SMTP não configurado..."
✅ Depois: "[emailService] E-mail enviado para usuario@example.com"
```

---

**Pronto para usar! 🚀**
