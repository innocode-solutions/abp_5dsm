# 🔧 Como Corrigir o Erro "/prisma": not found no Railway

## ⚠️ Problema

O erro `"/prisma": not found` acontece porque o Railway está fazendo build na **raiz do projeto** em vez do diretório `backend/`.

## ✅ Solução: Configurar Root Directory

### Passo a Passo Visual:

1. **Acesse o Railway Dashboard**
   - Vá para: https://railway.app
   - Faça login

2. **Selecione seu projeto**
   - Clique no projeto `abp_5dsm`

3. **Acesse o serviço backend**
   - Clique no serviço `abp_5dsm` (ou o nome do seu serviço backend)

4. **Vá em Settings**
   - Clique na aba **Settings** (ou no ícone ⚙️ de configurações)
   - Role a página para baixo

5. **Configure o Root Directory**
   - Procure a seção **"Build"** ou **"Build Settings"**
   - Encontre o campo **"Root Directory"**
   - **Digite exatamente**: `backend` (sem barra no final, sem aspas)
   - Clique em **"Save"** ou **"Update"**

6. **Verifique a configuração**
   - Após salvar, o Root Directory deve aparecer como: `backend`
   - O Railway vai fazer um novo deploy automaticamente

## 📸 Onde encontrar no Railway:

```
Railway Dashboard
  └── Seu Projeto (abp_5dsm)
      └── Seu Serviço (abp_5dsm)
          └── Settings (aba)
              └── Build (seção)
                  └── Root Directory: [backend] ← AQUI!
```

## ✅ Verificação

Após configurar, o próximo deploy deve mostrar nos logs:
- ✅ `Using Detected Dockerfile` (não Railpack)
- ✅ `COPY prisma ./prisma` funcionando
- ✅ Build completando com sucesso

## 🚨 Se ainda não funcionar:

1. **Verifique se salvou corretamente**
   - O Root Directory deve aparecer como `backend` (não vazio)
   - Faça um novo deploy manual se necessário

2. **Verifique se está no serviço correto**
   - Certifique-se de estar no serviço **backend**, não no PostgreSQL

3. **Tente fazer um Redeploy**
   - Vá em **Deployments**
   - Clique em **"Redeploy"** no último deployment

4. **Verifique os logs**
   - Os logs devem mostrar o contexto correto
   - Se ainda mostrar erro `/prisma`, o Root Directory não foi salvo

## 📝 Nota Importante

- O Root Directory **deve** ser `backend` (minúsculo, sem espaços)
- Não use `./backend` ou `/backend` ou `backend/`
- Apenas: `backend`

