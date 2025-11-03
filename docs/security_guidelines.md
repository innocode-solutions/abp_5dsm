# Security Guidelines – Backend
_Projeto: ABP 5 DSM • Mentora_

> **Escopo**: Este documento descreve as práticas de segurança encontradas no backend entregue (código em `backend/src/**`) e recomendações para hardening. Abrange: autenticação, criptografia, autorização, HTTPS, sanitização/validação, e logs/observability.

---

## 1) Autenticação
**O que existe**
- **Login / Registro / Me / Troca de senha** em `authRoutes.ts` → `AuthController`:
  - `POST /auth/register` e `POST /auth/login` com _schemas_ Zod (ver Sanitização).  
  - `GET /auth/me` protegido por **JWT**.  
  - `PUT /auth/:id/password` para troca de senha (hash aplicado em middleware).
- **JWT**: emissão em `AuthController.login` com `jsonwebtoken`, _exp_ **1h** e _payload_ `{ userId, role, email }`.
- **Extração/validação de token** em `AuthMiddleware.authenticateToken` e `optionalAuth`.
- **Segredo**: `process.env.JWT_SECRET` com _fallback_ de desenvolvimento (`your-super-secret-jwt-key-change-this-in-production`).

**Recomendações**
- **Produção**: definir `JWT_SECRET` forte (≥ 32 bytes) e **sem fallback**.
- Rotacionar segredo via _env_ e invalidar sessões antigas quando necessário.
- Considerar **refresh tokens** com _rotation_ e _reuse detection_ se o produto exigir long‑lived sessions.

---

## 2) Criptografia
**O que existe**
- **Hash de senha com bcrypt**: `passwordMiddleware.ts` usa `bcrypt.hash` com `saltRounds = 12`. `comparePasswords` usado no login.
- **JWT (HMAC-SHA)**: assinatura simétrica via `jsonwebtoken` (chave em `JWT_SECRET`).

**Recomendações**
- Manter `saltRounds` ≥ 12; avaliar **argon2id** em projetos de maior criticidade.
- Não armazenar **senhas em texto** (conforme o código atual).
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
- **Prisma** usado para consultas parametrizadas e _where_ tipado (mitiga SQL Injection).

**Recomendações**
- Cobrir **todas** as rotas sensíveis com RBAC/ownership explícito (auditar novas rotas ao serem criadas).
- Adicionar **tests** de autorização de _negative paths_ (ex.: TEACHER tentando recursos de outro teacher).

---

## 4) HTTPS / Transporte Seguro
**O que existe (server.ts)**  
- **TLS opcional**: carrega `SSL_KEY_PATH`/`SSL_CERT_PATH` via `fs`/`path` e **sobe HTTPS** quando os arquivos existem; caso contrário, inicia **HTTP** com _warning_.  
- **Redirect HTTP→HTTPS**: quando HTTPS está ativo, cria servidor HTTP que redireciona 301 para HTTPS (mesmo host e porta configurada).  
- **Helmet**: habilitado com **Content-Security-Policy (CSP)** restritiva (`defaultSrc 'self'`, `scriptSrc 'self'`, `imgSrc 'self' data: https:` etc.).  
- **CORS**: origem lida via `FRONTEND_URL` (fallback `http://localhost:3000`), `credentials: true`, métodos e cabeçalhos explicitamente permitidos.  
- **Body limits**: `express.json`/`urlencoded` com limite `10mb`.  
- **Timeout**: `res.setTimeout(30000)` com retorno **408** para requisições lentas.  
- **Health endpoints**: `/health` e `/health/db` via `HealthService`.  
- **Roteamento**: API em `/api`.  
- **404 handler**: resposta JSON com método, URL e timestamp.  
- **Error handler global**: loga erro e **omite stack em produção** (`NODE_ENV !== 'development'`).  
- **Graceful shutdown**: `HealthService.setupShutdownHandlers()`.

**Recomendações**
- Garantir **certificados válidos** em produção (cadeia completa) e renovar automaticamente (ex.: ACME/Let’s Encrypt).
- Ativar **HSTS** (pode ser via proxy/gateway) e revisar diretivas **CSP** conforme necessidades do front.
- Se estiver atrás de proxy, definir `app.set('trust proxy', 1)` para preservar `X-Forwarded-*` com segurança.
- Adicionar **rate limiting** (p. ex. `express-rate-limit`) se ainda não aplicado a nível de gateway.

---

## 5) Sanitização & Validação de Entrada
**O que existe**
- **Zod** com _schemas_ e middleware de validação:
  - `validationMiddleware.ts` (`validateBody/Query/Params`) → retorna **400** com lista de issues.
  - `authSchemas.ts`, `predictionSchemas.ts` (tipos, limites e coerções).
- **Sanitização global**: `sanitizeRequest` aplicado **antes** das rotas (`app.use(sanitizeRequest)`).
- **Hash de senha** no middleware remove o campo em claro após processar (`delete req.body.password`).
- **Prisma**: consultas parametrizadas (mitiga **SQL Injection**).
- **Testes E2E** cobrindo inputs maliciosos (XSS) retornando **400**.

**Recomendações**
- Garantir schemas Zod para **todas** as rotas novas (body, query e params).
- Normalizar/escapar campos de texto livres antes de renderização no front (mitiga XSS refletido).
- Em uploads/CSV, validar formato, tamanho e conteúdo permitido.

---

## 6) Logs & Observabilidade
**O que existe**
- **PrismaClient** com `log: ['query','error','warn']` em `src/config/database.ts`.
- **Error handler** controla **vazamento de stack** (mostra em `development`, oculta em produção).
- Uso de `console.error` para exceções (padrão Node).

**Recomendações**
- Adotar **logger estruturado** (ex.: `pino`) com `requestId`, nível por ambiente e _redaction_ de PII/senhas/tokens.
- **Não** logar `PasswordHash`/tokens/PII. Revisar _selects_ que incluem `PasswordHash`.
- Expor métricas (ex.: `/metrics` Prometheus) e centralizar logs (ELK/Datadog/Grafana).
- Alarmes para erros 5xx, picos 401/403, latência, tempo de DB, _timeouts_.

---

## 7) Configuração & Segredos
**O que existe**
- `.env.example` presente; uso de variáveis de ambiente para **JWT_SECRET**, **HTTP_PORT/HTTPS_PORT**, **FRONTEND_URL** e caminhos de certificados.
- `JWT_SECRET` com _fallback_ apenas para desenvolvimento.

**Recomendações**
- Armazenar segredos em **vault** (Doppler/Secrets Manager/KMS).  
- Usar **.env** só para _dev_; em produção, **injetar** via plataforma (sem commitar).

---

## 8) Checklists de Conformidade (para validação do time)
Marque antes do _merge/release_ desta sprint:

- [ ] **JWT_SECRET** de produção definido e sem fallback.
- [ ] **HTTPS** com certificados válidos e **redirect HTTP→HTTPS** verificado.
- [ ] **Helmet (CSP)**, **CORS** e **Body limits** aplicados.
- [ ] **Sanitização global** + **Schemas Zod** em todas as rotas impactadas.
- [ ] **RBAC/ownership** revisado para rotas sensíveis.
- [ ] **Logger estruturado** adotado ou plano de adoção definido.
- [ ] **Testes**: autenticação, autorização negativa, inputs maliciosos (XSS/SQLi), timeouts.
- [ ] **HSTS/trust proxy/rate limit** configurados no gateway/servidor conforme topologia.

Quando todos os itens acima estiverem marcados por **100% da equipe**, considerar “documentação validada” e “nenhum ponto pendente da sprint”.

---

## 9) Apêndice – Arquivos Relevantes
- `server.ts` – HTTPS, Helmet (CSP), CORS, body limits, sanitização global, timeouts, health, roteamento, 404, error handler, redirect HTTP→HTTPS, graceful shutdown.
- `src/controllers/authController.ts` – registro/login/me/senha + emissão de JWT.
- `src/middleware/authMiddleware.ts` – `authenticateToken`, `requireRole`, `requireOwnershipOrAdmin`, `requireStudentOwnership`, `optionalAuth`.
- `src/middleware/passwordMiddleware.ts` – `bcrypt.hash` (saltRounds=12) e `comparePasswords`.
- `src/middleware/sanitizeMiddleware.ts` – sanitização global de inputs.
- `src/validation/authSchemas.ts`, `src/validation/predictionSchemas.ts` – _schemas_ Zod.
- `src/middleware/validationMiddleware.ts` – _middleware_ genérico de validação.
- `src/routes/userRoutes.ts`, `src/routes/authRoutes.ts`, `src/routes/index.ts` – aplicação de RBAC/ownership.
- `src/config/database.ts` – Prisma com logs de `query/error/warn`.
- `tests/e2e_security_inputs.test.js` – simulações de inputs maliciosos.

---

## 10) Próximos Passos Sugeridos
- **HSTS** e cabeçalhos adicionais via Helmet: `frameguard`, `noSniff`, `referrerPolicy` (conforme necessidade).
- **Rate limiting** por rota/scope (login, APIs públicas) se não coberto no gateway.
- **Pino** com `pino-http` e `requestId` (traçabilidade).
- **Refresh tokens** e _logout_ baseado em _denylist_ (se aplicável).
