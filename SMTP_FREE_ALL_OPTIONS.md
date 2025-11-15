# 🎁 SMTP Gratuito para TODOS - Escolha o Seu

```
╔══════════════════════════════════════════════════════════════╗
║       3 OPÇÕES GRATUITAS DE SMTP - ESCOLHA UMA!             ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🥇 OPÇÃO 1: Mailtrap (Melhor para Agora)

**Setup:** 2 minutos ⚡
**Custo:** Gratuito
**E-mails/mês:** 500

```
╔─────────────────────────────────────────────────────────╗
║  MAILTRAP - Perfeito para Testes e Desenvolvimento     ║
╠─────────────────────────────────────────────────────────╣
║                                                         ║
║  ✅ Cadastre-se: https://mailtrap.io/                  ║
║  ✅ Vá em: Sending → SMTP Settings                    ║
║  ✅ Copie User e Password                             ║
║                                                         ║
║  .env:                                                  ║
║  SMTP_HOST=smtp.mailtrap.io                           ║
║  SMTP_PORT=2525                                        ║
║  SMTP_USER=<seu-usuario>                             ║
║  SMTP_PASS=<sua-senha>                               ║
║                                                         ║
║  💡 Todos os e-mails vão para seu dashboard           ║
║  💡 Não envia de verdade (apenas teste)               ║
║  💡 500 e-mails grátis por mês                        ║
║                                                         ║
╚─────────────────────────────────────────────────────────╝
```

---

## 🥈 OPÇÃO 2: Brevo (Melhor para Depois)

**Setup:** 10 minutos
**Custo:** Gratuito (até 300/dia)
**E-mails/mês:** 9.000 ⭐

```
╔─────────────────────────────────────────────────────────╗
║  BREVO - Melhor para Produção (Volume Médio)           ║
╠─────────────────────────────────────────────────────────╣
║                                                         ║
║  ✅ Cadastre-se: https://www.brevo.com/pt/            ║
║  ✅ Vá em: SMTP & API → Chaves SMTP                   ║
║  ✅ Copie User e Password                             ║
║                                                         ║
║  .env:                                                  ║
║  SMTP_HOST=smtp-relay.brevo.com                       ║
║  SMTP_PORT=587                                         ║
║  SMTP_USER=<seu-email>                                ║
║  SMTP_PASS=<sua-chave-brevo>                          ║
║                                                         ║
║  ✉️ Envia e-mails de verdade                           ║
║  📊 Dashboard completo                                 ║
║  📈 9.000 e-mails por mês GRÁTIS                      ║
║  🎯 Melhor custo-benefício                             ║
║                                                         ║
╚─────────────────────────────────────────────────────────╝
```

---

## 🥉 OPÇÃO 3: SendGrid (Melhor para Profissional)

**Setup:** 10 minutos
**Custo:** Gratuito (100/dia)
**E-mails/mês:** 100

```
╔─────────────────────────────────────────────────────────╗
║  SENDGRID - Profissional e Confiável                   ║
╠─────────────────────────────────────────────────────────╣
║                                                         ║
║  ✅ Cadastre-se: https://sendgrid.com/                 ║
║  ✅ Vá em: Settings → API Keys                         ║
║  ✅ Crie uma API Key                                   ║
║                                                         ║
║  .env:                                                  ║
║  SMTP_HOST=smtp.sendgrid.net                           ║
║  SMTP_PORT=587                                         ║
║  SMTP_USER=apikey                                      ║
║  SMTP_PASS=<sua-api-key>                              ║
║                                                         ║
║  ✉️ Envia e-mails de verdade                           ║
║  🔐 Muito seguro                                       ║
║  📈 API poderosa                                       ║
║  🎯 Usado por empresas grandes                         ║
║                                                         ║
╚─────────────────────────────────────────────────────────╝
```

---

## 📋 Tabela Comparativa

```
┌─────────┬──────────┬──────────┬────────────┬───────────────┐
│  SMTP   │  Setup   │ Gratuito │ Limite/mês │  Produção     │
├─────────┼──────────┼──────────┼────────────┼───────────────┤
│ Mailtrap│ 2 min    │   ✅     │    500     │  ❌ (teste)   │
│ Brevo   │ 10 min   │   ✅     │   9.000    │  ✅ (melhor)  │
│SendGrid │ 10 min   │   ✅     │    100     │  ✅ (pro)     │
│ Gmail   │ 15 min   │   ✅     │ Ilimitado  │  ✅ (ok)      │
└─────────┴──────────┴──────────┴────────────┴───────────────┘
```

---

## 🎯 Qual Escolher?

### 🚀 Quer começar AGORA (em 2 min)?
```
👉 Use MAILTRAP
   - Copie credenciais
   - Cole no .env
   - Teste no app
```

### 📈 Quer para PRODUÇÃO com volume?
```
👉 Use BREVO
   - 9.000 e-mails grátis
   - Melhor custo-benefício
   - Profissional
```

### 🏢 Quer solução PROFISSIONAL?
```
👉 Use SENDGRID
   - Muito confiável
   - API poderosa
   - Usado por grandes empresas
```

---

## ⚡ Quickstart - Comece Agora!

### Passo 1: Escolha um SMTP
- [ ] Mailtrap (mais rápido)
- [ ] Brevo (mais e-mails)
- [ ] SendGrid (mais profissional)

### Passo 2: Cadastre-se e Copie Credenciais

**Mailtrap:**
```
https://mailtrap.io/ → Sending → SMTP Settings
```

**Brevo:**
```
https://www.brevo.com/pt/ → SMTP & API → Chaves SMTP
```

**SendGrid:**
```
https://sendgrid.com/ → Settings → API Keys
```

### Passo 3: Preencha o `.env`

```env
SMTP_HOST=seu-host
SMTP_PORT=2525 ou 587
SMTP_USER=seu-usuario
SMTP_PASS=sua-senha
OTP_EMAIL_FROM=seu-email@seu-app.com
```

### Passo 4: Teste

```bash
cd backend
node test-smtp.js
```

Se retornar:
```
✅ Variáveis de ambiente configuradas:
✅ Conexão SMTP estabelecida com sucesso!
```

✅ **Tudo funcionando!**

### Passo 5: Inicie o Backend

```bash
npm run dev
```

### Passo 6: Teste no App Mobile

1. Abra o app
2. Clique "Esqueci minha senha"
3. Insira seu e-mail
4. Verifique no dashboard do SMTP escolhido

---

## 📊 Recomendação Final

```
┌─────────────────────────────────────────────────┐
│  🎯 PARA COMEÇAR HOJE:  Mailtrap              │
│     ✅ 2 minutos                               │
│     ✅ Gratuito                                │
│     ✅ Sem complicações                        │
│                                                │
│  📈 DEPOIS (Produção):  Brevo                 │
│     ✅ 9.000 e-mails/mês                      │
│     ✅ Profissional                            │
│     ✅ Melhor custo-benefício                  │
└─────────────────────────────────────────────────┘
```

---

## 🆘 Ajuda Rápida

**P: Qual é o mais fácil?**
R: Mailtrap - 2 minutos

**P: Qual tem mais e-mails?**
R: Brevo - 9.000/mês

**P: Qual é mais confiável?**
R: SendGrid - usado por empresas

**P: Qual use agora?**
R: Mailtrap - para testar rápido

---

## 📞 Próximas Ações

1. ✅ Escolha um SMTP
2. ✅ Cadastre-se
3. ✅ Copie credenciais
4. ✅ Preencha no `.env`
5. ✅ Execute: `node test-smtp.js`
6. ✅ Inicie: `npm run dev`
7. ✅ Teste no app mobile

**Total:** ~10 minutos até funcionar!

---

**Qual você quer usar? Avise e vou guiar passo-a-passo! 🚀**
