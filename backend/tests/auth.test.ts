// tests/auth.test.ts
import request from 'supertest';
import { setupTestDB } from './setupTest';
import { Express } from 'express';

describe('🧪 AuthController Endpoints', () => {
  let testUserEmail = '';
  let testUserPassword = '';
  let testUserId = '';
  let token = '';
  let app: Express;

  beforeAll(async () => {
    // Limpa cache de módulos e importa app após definir variáveis de ambiente
    jest.resetModules();
    app = (await import('../src/app')).default;

    // Cria usuários no banco de teste
    const { testUser, testUserPassword: tuPassword, adminToken } = await setupTestDB();

    testUserEmail = testUser.Email;
    testUserPassword = tuPassword;
    testUserId = testUser.IDUser;
    token = adminToken; // token admin, se precisar para rotas protegidas
  });

  it('POST /api/auth/login deve autenticar e retornar token válido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ Email: testUserEmail, password: testUserPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // token do student para rotas que exigem auth
  });

  it('POST /api/auth/login deve falhar com senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ Email: testUserEmail, password: 'senha_errada' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me deve retornar informações do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('Email', testUserEmail);
  });

  it('PUT /api/auth/:id/password deve atualizar a senha do usuário', async () => {
    const novaSenha = 'novaSenha123';

    const res = await request(app)
      .put(`/api/auth/${testUserId}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ PasswordHash: novaSenha });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Senha atualizada com sucesso');

    // Atualiza variável para login futuro
    testUserPassword = novaSenha;
  });

  it('POST /api/auth/login deve funcionar com nova senha', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ Email: testUserEmail, password: testUserPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});