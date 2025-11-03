# Security Guidelines
_Projeto: ABP 5 DSM • Mentora

---

## 1) Autenticação
**O que existe**
- **Login / Registro / Me / Troca de senha** em `authRoutes.ts` → `AuthController`:
  - `POST /auth/register` e `POST /auth/login` com _schemas_ Zod (ver Sanitização).  
  - `GET /auth/me` protegido por **JWT**.  
  - `PUT /auth/:id/password` para troca de senha (hash aplicado em middleware).
- **JWT**: emissão em `AuthController.login` com `jsonwebtoken`, _exp_ **1h** e _payload_ `{ userId, role, email }`.
- **Extração/validação de token** em `AuthMiddleware.authenticateToken` e `optionalAuth`.
- **Segredo**: `process.env.JWT_SECRET` com _fallback_ inseguro de desenvolvimento (`your-super-secret-jwt-key-change-this-in-production`).

**Recomendações**
- **Obrigatório em produção**: definir `JWT_SECRET` forte (≥ 32 bytes) e **sem fallback**.
- Rotacionar segredo via _env_ e invalidar sessões antigas quando necessário.
- Considerar **refresh tokens** com _rotation_ e _reuse detection_ se o produto exigir long‑lived sessions.

---

## 2) Criptografia
**O que existe**
- **Hash de senha com bcrypt**: `passwordMiddleware.ts` usa `bcrypt.hash` com `saltRounds = 12` (>=10 recomendado). `comparePasswords` usado no login.
- **JWT (HMAC-SHA)**: assinatura simétrica via `jsonwebtoken` (chave em `JWT_SECRET`).

**Recomendações**
- Manter `saltRounds` ≥ 12; avaliar **argon2id** em projetos de maior criticidade.
- Não armazenar **senhas em texto** (ok no código atual).
- Se houver PII sensível além de senha, considerar **criptografia em repouso** (campo‑a‑campo) e **colunas mascaradas**.

---

## 3) Autorização (RBAC & Ownership)
**O que existe**
- **Perfis**: `UserRole` (`ADMIN`, `TEACHER`, `STUDENT`).
- **Middlewares** em `authMiddleware.ts`:
  - `requireRole(role)` para RBAC por rota.
  - `requireOwnershipOrAdmin` (acesso ao próprio recurso ou ADMIN).
  - `requireStudentOwnership` (STUDENT acessa somente seus próprios dados; TEACHER/ADMIN liberado).
- **Aplicação nas rotas** (exemplos em `userRoutes.ts`):
  - `GET /api/users` e `DELETE /api/users/:id` → `requireRole(ADMIN)`.
  - `GET/PUT /api/users/:id` → `requireOwnershipOrAdmin`.
- **Prisma** usado para consultas com _where_ tipado, reduzindo chance de injeção SQL.

**Recomendações**
- Cobrir **todas** as rotas sensíveis com RBAC/ownership explícito (auditar novas rotas ao serem criadas).
- Adicionar **tests** de autorização de _negative paths_ (ex.: TEACHER tentando recursos de outro teacher).

---

## 4) HTTPS / Transporte Seguro
**O que existe**
- O repositório declara dependências `helmet`, `cors`, `express-rate-limit` no `package.json`.
- O arquivo `server.ts` não está presente no pacote entregue, então **não foi possível verificar** a aplicação efetiva de:
  - **TLS/HTTPS termination** (geralmente no gateway ou reverse proxy).
  - **Helmet/CORS/Rate Limit** na cadeia Express.
  - **Redirect HTTP→HTTPS** e `app.set('trust proxy', 1)` quando atrás de proxy.

**Recomendações (aplicar no servidor HTTP ou gateway)**  
_Exemplo de hardening em Express (server.ts):_
```ts
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cors from 'cors'

const app = express()
app.set('trust proxy', 1) // se atrás de proxy/load balancer

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }}))
app.use(cors({ origin: ['https://seu-front.app'], credentials: true }))
app.use(rateLimit({ windowMs: 15*60*1000, max: 300 }))

// redirect HTTP→HTTPS quando necessário (se não houver terminação no proxy)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url)
  }
  next()
})
```
- Garantir que **todas** as comunicações externas usem **HTTPS** e HSTS (no gateway).

---

## 5) Sanitização & Validação de Entrada
**O que existe**
- **Zod** com _schemas_ e middleware de validação:
  - `validationMiddleware.ts` (`validateBody/Query/Params`) → retorna **400** com lista de issues.
  - `authSchemas.ts`, `predictionSchemas.ts` (tipos, limites e coerções).
- **Hash de senha** no middleware remove o campo `password` em claro após processar (`delete req.body.password`).
- **Testes E2E de inputs maliciosos**: `tests/e2e_security_inputs.test.js` simula **XSS** e espera **400** na validação.
- **Prisma**: consultas parametrizadas (mitiga **SQL Injection**).

**Recomendações**
- Aplicar schemas Zod para **todas** as rotas novas (body, query e params).
- Quando necessário, normalizar/escapar campos de texto livres antes de renderização no front (mitiga XSS refletido no cliente).
- Em uploads/CSV, validar formato, tamanho e conteúdo permitido.

---

## 6) Logs & Observabilidade
**O que existe**
- **PrismaClient** configurado com `log: ['query','error','warn']` em `src/config/database.ts`.
- Uso de `console.error` em exceções de controllers/serviços.
- _Deps_ indicam intenção de observar requisições (`morgan`/`pino`), porém não há _wiring_ no servidor no pacote entregue.

**Recomendações**
- Adotar **logger estruturado** (ex.: `pino`) com correlação (`requestId`), nível por ambiente e _redaction_ de PII/senhas.
- **Não** logar `PasswordHash`/tokens/PII. Revisar _selects_ que incluem `PasswordHash` apenas quando estritamente necessário.
- Expor `/health` e `/health/db` (já existem em `HealthService`) para _probes_ de orquestradores.
- Prever **retention** e _centralization_ (ELK/Datadog/Grafana) e alarmes (erros 5xx, picos 401/403 etc.).

---

## 7) Configuração & Segredos
**O que existe**
- `.env.example` presente; uso de variáveis de ambiente para **JWT_SECRET** e configuração do Prisma.
- `JWT_SECRET` tem _fallback_ apenas para desenvolvimento.

**Recomendações**
- Armazenar segredos em **vault** (Doppler/Secrets Manager/KMS).  
- Usar **.env** só para _dev_; em produção, **injetar** via plataforma (sem commitar).

---

## 8) Checklists de Conformidade (para validação do time)
Marque antes do _merge/release_ desta sprint:

- [ ] **JWT_SECRET** de produção definido e sem fallback.
- [ ] **Helmet/CORS/Rate Limit** habilitados no `server.ts` ou no gateway.
- [ ] **Schemas Zod** aplicados em **todas** as rotas alteradas/novas.
- [ ] **RBAC/ownership** revisado para todas as rotas sensíveis.
- [ ] **Logs estruturados** (ou, temporariamente, Prisma + `console.*` com redaction).
- [ ] Revisão de **.env** e segredos feita.
- [ ] **Testes**: autenticação, autorização negativa, inputs maliciosos (XSS/SQLi), trocas de senha.

Quando todos os itens acima estiverem marcados por **100% da equipe**, considerar “documentação validada” e “nenhum ponto pendente da sprint”.

---

## 9) Apêndice – Arquivos Relevantes
- `src/controllers/authController.ts` – registro/login/me/senha + emissão de JWT.
- `src/middleware/authMiddleware.ts` – `authenticateToken`, `requireRole`, `requireOwnershipOrAdmin`, `requireStudentOwnership`, `optionalAuth`.
- `src/middleware/passwordMiddleware.ts` – `bcrypt.hash` (saltRounds=12) e `comparePasswords`.
- `src/validation/authSchemas.ts`, `src/validation/predictionSchemas.ts` – _schemas_ Zod.
- `src/middleware/validationMiddleware.ts` – _middleware_ genérico de validação.
- `src/routes/userRoutes.ts`, `src/routes/authRoutes.ts`, `src/routes/index.ts` – aplicação de RBAC/ownership.
- `src/config/database.ts` – Prisma com logs de `query/error/warn`.
- `tests/e2e_security_inputs.test.js` – simulações de inputs maliciosos.

---

## 10) Próximos Passos Sugeridos (se o time optar por ir além nesta sprint)
- Implementar `server.ts` (ou revisar) para **helmet/cors/rate-limit** e redirecionamento HTTPS.
- Adotar **Pino** com `pino-http` e `requestId` (traçabilidade).
- **Refresh tokens** e _logout_ baseado em _denylist_ (se aplicável).
- _Security headers_ adicionais via Helmet: `frameguard`, `noSniff`, `referrerPolicy`, `hsts` (no proxy).
