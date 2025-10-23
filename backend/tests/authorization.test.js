const request = require('supertest');
const { app } = require('../server');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Helper para criar tokens JWT
const createToken = (userId, role, email) => {
  return jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '1h' });
};

// Tokens de teste para diferentes roles
const adminToken = createToken('admin-123', 'ADMIN', 'admin@test.com');
const teacherToken = createToken('teacher-123', 'TEACHER', 'teacher@test.com');
const studentToken = createToken('student-123', 'STUDENT', 'student@test.com');
const studentWithOwnershipToken = createToken('student-456', 'STUDENT', 'student2@test.com');

describe('Controle de Acesso por Perfil', () => {
  
  describe('Rotas de Cursos', () => {
    it('deve permitir leitura para todos os roles autenticados', async () => {
      const roles = [adminToken, teacherToken, studentToken];
      
      for (const token of roles) {
        const response = await request(app)
          .get('/api/cursos')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
      }
    });

    it('deve permitir apenas ADMIN criar cursos', async () => {
      const response = await request(app)
        .post('/api/cursos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ NomeDoCurso: 'Teste', Descricao: 'Teste' });
      
      expect(response.status).toBe(201);
    });

    it('deve negar acesso para TEACHER criar cursos', async () => {
      const response = await request(app)
        .post('/api/cursos')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ NomeDoCurso: 'Teste', Descricao: 'Teste' });
      
      expect(response.status).toBe(403);
    });

    it('deve negar acesso para STUDENT criar cursos', async () => {
      const response = await request(app)
        .post('/api/cursos')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ NomeDoCurso: 'Teste', Descricao: 'Teste' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Disciplinas', () => {
    it('deve permitir leitura para todos os roles autenticados', async () => {
      const roles = [adminToken, teacherToken, studentToken];
      
      for (const token of roles) {
        const response = await request(app)
          .get('/api/disciplinas')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
      }
    });

    it('deve permitir apenas ADMIN criar disciplinas', async () => {
      const response = await request(app)
        .post('/api/disciplinas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ NomeDaDisciplina: 'Teste', CodigoDaDisciplina: 'TEST001' });
      
      expect(response.status).toBe(201);
    });

    it('deve negar acesso para TEACHER criar disciplinas', async () => {
      const response = await request(app)
        .post('/api/disciplinas')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ NomeDaDisciplina: 'Teste', CodigoDaDisciplina: 'TEST001' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Alunos', () => {
    it('deve permitir listagem apenas para TEACHER e ADMIN', async () => {
      // ADMIN deve ter acesso
      const adminResponse = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);

      // TEACHER deve ter acesso
      const teacherResponse = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(teacherResponse.status).toBe(200);

      // STUDENT não deve ter acesso
      const studentResponse = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentResponse.status).toBe(403);
    });

    it('deve permitir apenas ADMIN criar alunos', async () => {
      const response = await request(app)
        .post('/api/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Nome: 'Teste', Email: 'teste@test.com' });
      
      expect(response.status).toBe(201);
    });

    it('deve negar acesso para TEACHER criar alunos', async () => {
      const response = await request(app)
        .post('/api/alunos')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ Nome: 'Teste', Email: 'teste@test.com' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Matrículas', () => {
    it('deve permitir listagem apenas para TEACHER e ADMIN', async () => {
      // ADMIN deve ter acesso
      const adminResponse = await request(app)
        .get('/api/matriculas')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);

      // TEACHER deve ter acesso
      const teacherResponse = await request(app)
        .get('/api/matriculas')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(teacherResponse.status).toBe(200);

      // STUDENT não deve ter acesso
      const studentResponse = await request(app)
        .get('/api/matriculas')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentResponse.status).toBe(403);
    });

    it('deve permitir TEACHER e ADMIN criar matrículas', async () => {
      const teacherResponse = await request(app)
        .post('/api/matriculas')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ IDAluno: 'test', IDDisciplina: 'test', IDPeriodo: 'test' });
      
      expect(teacherResponse.status).toBe(201);
    });

    it('deve negar acesso para STUDENT criar matrículas', async () => {
      const response = await request(app)
        .post('/api/matriculas')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ IDAluno: 'test', IDDisciplina: 'test', IDPeriodo: 'test' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Dashboard', () => {
    it('deve permitir acesso ao dashboard do professor para TEACHER e ADMIN', async () => {
      const teacherResponse = await request(app)
        .get('/api/dashboard/professor/teacher-123')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(teacherResponse.status).toBe(200);

      const adminResponse = await request(app)
        .get('/api/dashboard/professor/admin-123')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);
    });

    it('deve negar acesso ao dashboard do professor para STUDENT', async () => {
      const response = await request(app)
        .get('/api/dashboard/professor/student-123')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(response.status).toBe(403);
    });

    it('deve permitir acesso ao dashboard IES apenas para ADMIN', async () => {
      const adminResponse = await request(app)
        .get('/api/dashboard/ies/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);
    });

    it('deve negar acesso ao dashboard IES para TEACHER', async () => {
      const response = await request(app)
        .get('/api/dashboard/ies/overview')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(response.status).toBe(403);
    });

    it('deve negar acesso ao dashboard IES para STUDENT', async () => {
      const response = await request(app)
        .get('/api/dashboard/ies/overview')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Predições', () => {
    it('deve permitir leitura para todos os roles autenticados', async () => {
      const roles = [adminToken, teacherToken, studentToken];
      
      for (const token of roles) {
        const response = await request(app)
          .get('/api/predictions')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
      }
    });

    it('deve permitir TEACHER e ADMIN criar predições', async () => {
      const teacherResponse = await request(app)
        .post('/api/predictions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ IDMatricula: 'test', TipoPredicao: 'DESEMPENHO', Probabilidade: 0.8, Classificacao: 'aprovado' });
      
      expect(teacherResponse.status).toBe(201);
    });

    it('deve negar acesso para STUDENT criar predições', async () => {
      const response = await request(app)
        .post('/api/predictions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ IDMatricula: 'test', TipoPredicao: 'DESEMPENHO', Probabilidade: 0.8, Classificacao: 'aprovado' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Usuários', () => {
    it('deve permitir listagem apenas para ADMIN', async () => {
      const adminResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);

      const teacherResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(teacherResponse.status).toBe(403);

      const studentResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentResponse.status).toBe(403);
    });

    it('deve permitir apenas ADMIN criar usuários', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Email: 'test@test.com', password: '123456', Role: 'STUDENT' });
      
      expect(response.status).toBe(201);
    });

    it('deve negar acesso para TEACHER criar usuários', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ Email: 'test@test.com', password: '123456', Role: 'STUDENT' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Rotas de Períodos', () => {
    it('deve permitir leitura para todos os roles autenticados', async () => {
      const roles = [adminToken, teacherToken, studentToken];
      
      for (const token of roles) {
        const response = await request(app)
          .get('/api/periodos')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
      }
    });

    it('deve permitir apenas ADMIN criar períodos', async () => {
      const response = await request(app)
        .post('/api/periodos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Nome: '2024.1', DataInicio: '2024-01-01', DataFim: '2024-06-30' });
      
      expect(response.status).toBe(201);
    });

    it('deve negar acesso para TEACHER criar períodos', async () => {
      const response = await request(app)
        .post('/api/periodos')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ Nome: '2024.1', DataInicio: '2024-01-01', DataFim: '2024-06-30' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Validação de Token', () => {
    it('deve retornar 401 para requisições sem token', async () => {
      const response = await request(app)
        .get('/api/cursos');
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 401 para token inválido', async () => {
      const response = await request(app)
        .get('/api/cursos')
        .set('Authorization', 'Bearer token-invalido');
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 401 para token expirado', async () => {
      const expiredToken = jwt.sign({ userId: 'test', role: 'ADMIN', email: 'test@test.com' }, JWT_SECRET, { expiresIn: '-1h' });
      
      const response = await request(app)
        .get('/api/cursos')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
    });
  });
});
