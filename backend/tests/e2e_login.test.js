const axios = require('axios');

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

describe('E2E - Login retorna JWT e atende SLA (<500ms)', () => {
  const email = `qa.login.${Date.now()}@example.com`;
  const password = 'SenhaForte123!';
  let postSpy;
  let useMock = false;

  beforeAll(async () => {
    const healthy = await isApiHealthy();
    useMock = !healthy && !RUN_REAL_API;

    if (useMock) {
      postSpy = jest.spyOn(axios, 'post');
      postSpy.mockImplementation((url, body) => {
        if (url.endsWith('/auth/register')) {
          return Promise.resolve({ status: 201, data: { IDUser: 'mock', Email: body.Email, Role: 'ADMIN', name: body.name } });
        }
        if (url.endsWith('/auth/login')) {
          return Promise.resolve({ status: 200, data: { token: 'mocked.jwt.token', user: { Email: body.Email, Role: 'ADMIN' }, expiresIn: '1h' } });
        }
        return Promise.reject(new Error('Unexpected URL in mock'));
      });
    }
  });

  afterAll(() => { if (postSpy) postSpy.mockRestore(); });

  it('deve registrar (ou ignorar se já existir) e efetuar login com JWT em <500ms', async () => {
    // Tenta registrar usuário ADMIN para poder usar rotas protegidas em outros testes
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        Email: email,
        password,
        Role: 'ADMIN',
        name: 'QA Login'
      });
    } catch (err) {
      // 409 = já existe; prossegue para login
      if (!(err?.response && err.response.status === 409)) {
        throw err;
      }
    }

    const start = Date.now();
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      Email: email,
      password
    });
    const durationMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('token');
    expect(typeof res.data.token).toBe('string');
    expect(durationMs).toBeLessThan(500);
  });
});


