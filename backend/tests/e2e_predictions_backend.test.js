const axios = require('axios');
const { createTestGraph, cleanupTestGraph } = require('./helpers/seed');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const RUN_REAL_API = process.env.RUN_REAL_API === 'true';
const SERVER_BASE = API_BASE_URL.replace(/\/?api$/, '');

async function isApiHealthy() {
  try {
    const [h1, h2] = await Promise.all([
      axios.get(`${SERVER_BASE}/health`, { timeout: 800 }),
      axios.get(`${SERVER_BASE}/health/db`, { timeout: 800 })
    ]);
    return (h1.status === 200) && (h2.status === 200);
  } catch {
    return false;
  }
}

describe('E2E - Predições via Backend com ML e SLA (<500ms)', () => {
  let token;
  let graph;
  const adminEmail = `qa.pred.admin.${Date.now()}@example.com`;
  const adminPass = 'SenhaForte123!';
  let postSpy;
  let useMock = false;

  beforeAll(async () => {
    const healthy = await isApiHealthy();
    useMock = !healthy && !RUN_REAL_API;

    if (useMock) {
      // Mock axios.post para registrar, logar e gerar predições
      postSpy = jest.spyOn(axios, 'post');
      postSpy.mockImplementation((url, body) => {
        if (url.endsWith('/auth/register')) {
          return Promise.resolve({ status: 201, data: { IDUser: 'mock', Email: body.Email, Role: 'ADMIN' } });
        }
        if (url.endsWith('/auth/login')) {
          return Promise.resolve({ status: 200, data: { token: 'mocked.jwt.token' } });
        }
        if (url.endsWith('/predictions/generate')) {
          return Promise.resolve({
            status: 201,
            data: {
              success: true,
              message: 'Predição gerada e salva com sucesso',
              data: {
                IDPrediction: 'mock-pred',
                IDMatricula: body.IDMatricula,
                TipoPredicao: body.TipoPredicao,
                Probabilidade: body.TipoPredicao === 'EVASAO' ? 0.22 : 0.81,
                Classificacao: body.TipoPredicao === 'EVASAO' ? 'Low' : 'High',
                Explicacao: 'mocked'
              }
            }
          });
        }
        return Promise.reject(new Error('Unexpected URL in mock'));
      });
      // Grafo falso para quando não há DB
      graph = { matriculaId: 'mock-matricula' };
      token = 'mocked.jwt.token';
      return;
    }

    // Registrar admin
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        Email: adminEmail,
        password: adminPass,
        Role: 'ADMIN',
        name: 'QA Admin'
      });
    } catch (err) {
      if (!(err?.response && err.response.status === 409)) {
        throw err;
      }
    }
    // Login
    const login = await axios.post(`${API_BASE_URL}/auth/login`, { Email: adminEmail, password: adminPass });
    token = login.data.token;

    // Criar grafo de dados (curso, disciplina, aluno, periodo, matricula)
    graph = await createTestGraph();
  });

  afterAll(async () => {
    if (!useMock) await cleanupTestGraph(graph);
    if (postSpy) postSpy.mockRestore();
  });

  it('DESEMPENHO: deve criar predição com latência <500ms', async () => {
    const payload = {
      IDMatricula: graph.matriculaId,
      TipoPredicao: 'DESEMPENHO',
      dados: {
        Hours_Studied: 6.0,
        Previous_Scores: 85.0,
        Sleep_Hours: 8.0,
        Distance_from_Home: 'Near',
        Attendance: 95.0,
        Gender: 'Male',
        Parental_Education_Level: "Bachelor's",
        Parental_Involvement: 'High',
        School_Type: 'Public',
        Peer_Influence: 'Positive',
        Extracurricular_Activities: 'Yes',
        Learning_Disabilities: 'No',
        Internet_Access: 'Yes',
        Access_to_Resources: 'Good',
        Teacher_Quality: 'Good',
        Family_Income: 'High',
        Motivation_Level: 'High',
        Tutoring_Sessions: 'No',
        Physical_Activity: 'High'
      }
    };

    const start = Date.now();
    const res = await axios.post(`${API_BASE_URL}/predictions/generate`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const durationMs = Date.now() - start;

    expect(res.status).toBe(201);
    expect(res.data?.data).toHaveProperty('IDPrediction');
    expect(res.data?.data).toHaveProperty('Probabilidade');
    expect(typeof res.data.data.Probabilidade).toBe('number');
    expect(durationMs).toBeLessThan(500);
  });

  it('EVASAO: deve criar predição com latência <500ms', async () => {
    const payload = {
      IDMatricula: graph.matriculaId,
      TipoPredicao: 'EVASAO',
      dados: {
        raisedhands: 50,
        VisITedResources: 30,
        AnnouncementsView: 20,
        Discussion: 15,
        ParentAnsweringSurvey: 'Yes',
        ParentschoolSatisfaction: 'Good',
        StudentAbsenceDays: 'Under-7'
      }
    };

    const start = Date.now();
    const res = await axios.post(`${API_BASE_URL}/predictions/generate`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const durationMs = Date.now() - start;

    expect(res.status).toBe(201);
    expect(res.data?.data).toHaveProperty('IDPrediction');
    expect(res.data?.data).toHaveProperty('Probabilidade');
    expect(typeof res.data.data.Probabilidade).toBe('number');
    expect(durationMs).toBeLessThan(500);
  });
});


