# 🐳 Teste Local do Docker

Este guia explica como testar o build e execução do Docker localmente antes de fazer deploy no Railway.

## 📋 Pré-requisitos

1. **Docker Desktop** instalado e rodando
2. **PowerShell** (já vem com Windows)
3. Acesso ao diretório `backend`

## 🚀 Teste Rápido

### 1. Testar o Build

Execute o script de teste de build:

```powershell
cd backend
.\scripts\test-docker-build.ps1
```

Este script irá:
- ✅ Verificar se o Docker está rodando
- ✅ Verificar se o Dockerfile existe
- ✅ Fazer o build da imagem Docker
- ✅ Verificar se o build foi bem-sucedido
- ✅ Mostrar informações da imagem criada

**Tempo estimado:** 5-10 minutos (primeira vez pode levar mais devido ao download de dependências)

### 2. Testar a Execução (Opcional)

Após o build bem-sucedido, você pode testar a execução do container:

```powershell
# Teste simples (sem banco de dados)
.\scripts\test-docker-run.ps1

# Teste completo (com banco de dados)
.\scripts\test-docker-run.ps1 -WithDatabase
```

## 🔍 O que o teste verifica?

### Build (`test-docker-build.ps1`)
- ✅ Instalação do Node.js 18
- ✅ Instalação do Python 3 e dependências do sistema (cmake, llvm, etc.)
- ✅ Instalação das dependências Node.js
- ✅ Compilação do TypeScript
- ✅ Geração do Prisma Client
- ✅ Instalação das dependências Python (requirements.txt)
- ✅ Compilação do llvmlite (que requer cmake e llvm)

### Execução (`test-docker-run.ps1`)
- ✅ Inicialização do container
- ✅ Execução das migrations do Prisma
- ✅ Inicialização do servidor
- ✅ Health check

## ⚠️ Problemas Comuns

### Erro: "cmake not found"
**Solução:** O Dockerfile já inclui `cmake` e `llvm-dev`. Se o erro persistir:
1. Verifique se você está usando o Dockerfile correto (na raiz do `backend`)
2. Limpe o cache do Docker: `docker builder prune -a`
3. Tente novamente o build

### Erro: "externally-managed-environment" (PEP 668)
**Solução:** O Dockerfile já inclui `--break-system-packages`. Se o erro persistir:
1. Verifique se o Dockerfile está atualizado
2. Limpe o cache do Docker

### Build muito lento
**Normal na primeira vez:** O build baixa muitas dependências (Node.js, Python, pacotes Alpine, etc.). Builds subsequentes serão mais rápidos devido ao cache do Docker.

### Erro de permissão no PowerShell
**Solução:** Execute o PowerShell como Administrador ou ajuste a política de execução:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 Interpretando os Resultados

### ✅ Build Bem-Sucedido
```
✅ Build concluído com sucesso!
✅ Imagem 'abp-backend-test:latest' criada com sucesso
```
**Significa:** O Dockerfile está correto e pronto para deploy no Railway!

### ❌ Build Falhou
```
❌ Build falhou!
ERROR: Failed building wheel for llvmlite
FileNotFoundError: [Errno 2] No such file or directory: 'cmake'
```
**Significa:** Há um problema com as dependências. Verifique:
1. Se o Dockerfile está atualizado
2. Se todas as dependências estão listadas no `apk add`
3. Os logs completos do build para mais detalhes

## 🎯 Próximos Passos

Após um build bem-sucedido:

1. **Commit e Push:**
   ```bash
   git add backend/Dockerfile
   git commit -m "fix: configuração Docker para Railway"
   git push
   ```

2. **Deploy no Railway:**
   - O Railway detectará automaticamente o push
   - Configure as variáveis de ambiente necessárias
   - Monitore os logs do deploy

3. **Verificar Health Check:**
   - Após o deploy, acesse: `https://seu-app.railway.app/health`

## 📝 Notas

- A imagem de teste (`abp-backend-test:latest`) pode ser removida após o teste:
  ```powershell
  docker image rm abp-backend-test:latest
  ```
- O build local usa o mesmo Dockerfile que será usado no Railway
- Se o build local funcionar, o build no Railway também deve funcionar (assumindo que as variáveis de ambiente estão corretas)

