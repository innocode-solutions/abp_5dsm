# 🐳 Docker Setup — ABP Backend

Este diretório contém toda a configuração Docker para executar o **backend do sistema ABP**, incluindo ambiente local, staging (HTTPS interno) e produção (Nginx + Let's Encrypt).

---

## 🗂️ Estrutura do diretório

```
backend/
├── docker/
│   ├── dockerfile                 # Build principal do backend (Node.js + Prisma)
│   ├── docker-compose.yml         # Staging/Local com HTTPS interno (autoassinado)
│   ├── docker-compose.dev.yml     # Desenvolvimento rápido (HTTP + hot reload)
│   ├── docker-compose.prod.yml    # Produção com NGINX + Certbot (Let's Encrypt)
│   │
│   ├── nginx/
│   │   ├── conf.d/default.conf    # Configuração do proxy reverso HTTPS
│   │   ├── ssl/                   # Certificados Let's Encrypt
│   │   └── www/                   # Webroot para validação do Certbot
│   │
│   ├── nginx-init.sh              # Script para gerar certificado SSL e subir NGINX
│   └── logs/                      # Logs do Nginx (opcional)
│
├── certs/                         # Certificados locais para HTTPS interno
│   ├── server.key
│   └── server.cert
├── prisma/                        # Schemas e migrações Prisma
├── src/                           # Código-fonte do backend
└── .env                           # Variáveis de ambiente globais
```

---

## ⚙️ Arquivos principais

| Arquivo | Função |
|----------|--------|
| **dockerfile** | Cria a imagem Node.js/Prisma em múltiplas etapas (build + produção). |
| **docker-compose.yml** | Staging/local seguro com HTTPS (`certs/server.cert`). |
| **docker-compose.dev.yml** | Desenvolvimento com hot reload (HTTP). |
| **docker-compose.prod.yml** | Produção com Nginx + Certbot (Let's Encrypt). |
| **nginx-init.sh** | Script para criar certificados e iniciar o proxy reverso. |
| **nginx/conf.d/default.conf** | Configura redirecionamento HTTP→HTTPS e proxy para o backend. |

---

## 🌍 Ambientes disponíveis

| Ambiente | Compose | HTTPS | Uso típico |
|-----------|----------|--------|-------------|
| 🧑‍💻 **Desenvolvimento** | `docker-compose.dev.yml` | ❌ | Hot reload local |
| 🧪 **Staging (Interno)** | `docker-compose.yml` | ✅ (autoassinado) | Testes locais |
| 🌐 **Produção** | `docker-compose.prod.yml` | ✅ (Let's Encrypt) | Deploy público |

---

## ⚡ Quick Start

### 1. Criar o arquivo `.env`
```bash
cp .env.example .env
```

Atualize variáveis críticas:
- `POSTGRES_PASSWORD` — senha segura do banco
- `JWT_SECRET` — chave longa e aleatória
- `DOMAIN_NAME`, `EMAIL_ADMIN` — apenas para produção (Let's Encrypt)

---

### 2. Subir ambiente local (HTTP)
```bash
docker compose -f docker-compose.dev.yml up --build
```

Acesse:
- API: http://localhost:3000/api  
- Health check: http://localhost:3000/health  
- pgAdmin: http://localhost:5050  

---

### 3. Subir ambiente HTTPS local (autoassinado)
Usa certificados locais em `backend/certs/`.

```bash
docker compose up --build
```

Acesse:
- API: https://localhost:8443/api  
- Health check: https://localhost:8443/health  

---

### 4. Subir produção (Let's Encrypt)
Com domínio válido (`api.seudominio.com`):

```bash
cd backend/docker
chmod +x nginx-init.sh
./nginx-init.sh
```

Gera certificado, inicia backend + Nginx e aplica HTTPS real.

---

## 🔐 Portas padrão

| Serviço | Interna | Externa | Descrição |
|----------|----------|----------|------------|
| Backend (HTTP) | 3000 | 3000 | Fallback / debug |
| HTTP redirect | 8080 | 8080 | Redireciona para HTTPS |
| Backend (HTTPS) | 8443 | 8443 | API segura |
| PostgreSQL | 5432 | 5432 | Banco de dados |
| pgAdmin | 80 | 5050 | Interface DB |

---

## 🧩 Serviços incluídos

| Serviço | Descrição | Porta |
|----------|------------|-------|
| **backend** | API Node.js/TypeScript com HTTPS e Prisma | 3000 / 8443 |
| **postgres** | Banco de dados PostgreSQL | 5432 |
| **pgadmin** | Interface web opcional para o banco | 5050 |
| **nginx** | Proxy reverso e HTTPS (prod) | 80 / 443 |
| **certbot** | Renovação automática de certificados | — |

---

## 🧰 Comandos úteis

### Desenvolvimento
```bash
docker compose up
docker compose up --build
docker compose logs -f backend
docker compose exec backend npx prisma migrate deploy
```

### Produção
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

### Banco de dados
```bash
docker compose exec backend npx prisma generate
docker compose exec postgres psql -U abp_user -d academic_management
```

### Manutenção
```bash
docker compose down
docker compose down -v
docker system prune -a
```

---

## 💓 Health Checks

| Endpoint | Descrição |
|-----------|------------|
| `/health` | Verifica status da API |
| `/health/db` | Verifica conexão com o banco |

📍 Exemplo:
```
https://localhost:8443/health
https://localhost:8443/health/db
```

---

## 📊 Logs e Debug

```bash
docker compose logs
docker compose logs backend
```

---

## 🛡️ Segurança

- ✅ Use senhas fortes no `.env`
- ✅ Altere `JWT_SECRET` e `POSTGRES_PASSWORD`
- 🔐 Em produção, use **Let's Encrypt**
- 🧱 Mantenha a porta **80 aberta** (para validação SSL)
- 🧾 Faça backup do volume `postgres_data`

---

## ⚙️ Renovação automática (produção)

Certbot roda a cada 12h no container e renova o SSL.  
Para aplicar sem downtime:
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## ✅ Checklist de Deploy

- [ ] `.env` configurado com domínio e credenciais
- [ ] DNS do domínio apontando para o servidor
- [ ] Porta 80/443 liberadas no firewall
- [ ] Prisma migrações aplicadas
- [ ] Containers sobem com `healthcheck: healthy`

---

## 🧾 Resumo rápido

| Ambiente | HTTPS | Compose | Comando |
|-----------|--------|----------|----------|
| Dev local | ❌ | `docker-compose.dev.yml` | `docker compose -f docker-compose.dev.yml up --build` |
| Staging | ✅ (autoassinado) | `docker-compose.yml` | `docker compose up --build` |
| Produção | ✅ (Let's Encrypt) | `docker-compose.prod.yml` | `./nginx-init.sh` |

---

## ⚠️ Solução de Problemas

| Problema | Causa possível | Solução |
|-----------|----------------|----------|
| Porta em uso | Conflito com outro app | Mude portas no `.env` |
| Falha no banco | Postgres não iniciou | `docker compose ps` e `logs postgres` |
| HTTPS inválido | Certificado ausente | Execute `nginx-init.sh` novamente |
| Build falha | Cache antigo | `docker builder prune` + rebuild |
| Sem acesso externo | Firewall bloqueando 80/443 | Liberar portas |
