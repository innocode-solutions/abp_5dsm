// tests/aluno.test.ts
import request from 'supertest';
import { Express } from 'express';
import prisma from '../src/config/database';
import { setupTestDB } from './setupTest';

describe('Aluno Endpoints', () => {
  let app: Express;
  let adminToken: string;
  let cursoId: string;
  let alunoId: string;
  let alunoEmail: string;

  beforeAll(async () => {
    // 1️⃣ Setup do DB e admin
    const setup = await setupTestDB();
    adminToken = setup.adminToken;

    // 2️⃣ Importa app depois que variáveis de ambiente estão definidas
    app = (await import('../src/app')).default;

    // 3️⃣ Limpa alunos e cursos antigos
    await prisma.aluno.deleteMany({});
    await prisma.curso.deleteMany({});

    // 4️⃣ Cria um curso de teste
    const curso = await prisma.curso.create({
      data: {
        NomeDoCurso: 'Engenharia de Software',
        Descricao: 'Curso focado em desenvolvimento e arquitetura de sistemas',
      },
    });
    cursoId = curso.IDCurso;
  });

  it('POST /api/alunos deve criar um novo aluno', async () => {
    // Gera email único
    alunoEmail = `aluno_${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        Nome: 'Aluno Teste TDD',
        Email: alunoEmail,
        Idade: 21,
        IDCurso: cursoId,
        Semestre: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('IDAluno');
    expect(res.body.Nome).toBe('Aluno Teste TDD');
    alunoId = res.body.IDAluno;
  });

  it('GET /api/alunos deve listar os alunos cadastrados', async () => {
    const res = await request(app)
      .get('/api/alunos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/alunos/:id deve retornar um aluno específico', async () => {
    const res = await request(app)
      .get(`/api/alunos/${alunoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('IDAluno', alunoId);
    expect(res.body.Nome).toBe('Aluno Teste TDD');
  });

  it('POST /api/alunos com email duplicado deve retornar 409', async () => {
    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        Nome: 'Aluno Duplicado',
        Email: alunoEmail, // mesmo email do teste anterior
        Idade: 22,
        IDCurso: cursoId,
        Semestre: 2,
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/alunos com curso inexistente deve retornar 404', async () => {
    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        Nome: 'Aluno Curso Invalido',
        Email: `aluno_invalido_${Date.now()}@example.com`,
        Idade: 20,
        IDCurso: 'curso_inexistente',
        Semestre: 1,
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Course not found');
  });

  it('PUT /api/alunos/:id deve atualizar um aluno existente', async () => {
    const novoNome = 'Aluno Atualizado TDD';
    const res = await request(app)
      .put(`/api/alunos/${alunoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ Nome: novoNome, Idade: 22, Semestre: 2, IDCurso: cursoId }); // Envia todos os campos necessários

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('Nome', novoNome);
    expect(res.body).toHaveProperty('Idade', 22);

    // Verificação extra no banco de dados (opcional, mas boa prática)
    const updatedAluno = await prisma.aluno.findUnique({ where: { IDAluno: alunoId } });
    expect(updatedAluno?.Nome).toBe(novoNome);
  });

  it('PUT /api/alunos/:id deve retornar 404 se o aluno não for encontrado', async () => {
    const res = await request(app)
      .put('/api/alunos/aluno_id_inexistente')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ Nome: 'Inexistente' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Student not found');
  });

  it('DELETE /api/alunos/:id deve deletar um aluno', async () => {
    const res = await request(app)
      .delete(`/api/alunos/${alunoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204); // Resposta 204 No Content

    // Verificação no banco de dados
    const deletedAluno = await prisma.aluno.findUnique({ where: { IDAluno: alunoId } });
    expect(deletedAluno).toBeNull();
  });

  it('DELETE /api/alunos/:id deve retornar 404 se o aluno não for encontrado para deletar', async () => {
    const res = await request(app)
      .delete(`/api/alunos/${alunoId}`) // Tenta deletar de novo
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Student not found');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});