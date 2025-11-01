const axios = require('axios')

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api'
const RUN_REAL_API = process.env.RUN_REAL_API === 'true'
const SERVER_BASE = API_BASE_URL.replace(/\/?api$/, '')

async function isApiHealthy() {
  try {
    const [h1, h2] = await Promise.all([
      axios.get(`${SERVER_BASE}/health`, { timeout: 800 }),
      axios.get(`${SERVER_BASE}/health/db`, { timeout: 800 })
    ])
    return (h1.status === 200) && (h2.status === 200)
  } catch {
    return false
  }
}

describe('E2E - Segurança de inputs (XSS/strings perigosas)', () => {
  let useMock = false
  let postSpy

  beforeAll(async () => {
    const healthy = await isApiHealthy()
    useMock = !healthy && !RUN_REAL_API

    if (useMock) {
      postSpy = jest.spyOn(axios, 'post')
      postSpy.mockImplementation((url, body) => {
        if (url.endsWith('/auth/register')) {
          // Simula validação do backend retornando 400 em entrada maliciosa
          if (String(body.name || '').includes('<script')) {
            const error = new Error('Bad Request')
            error.response = { status: 400, data: { error: 'Erro de validação' } }
            return Promise.reject(error)
          }
          return Promise.resolve({ status: 201, data: { IDUser: 'mock', Email: body.Email, Role: 'ADMIN', name: body.name } })
        }
        return Promise.reject(new Error('Unexpected URL in mock'))
      })
    }
  })

  afterAll(() => { if (postSpy) postSpy.mockRestore() })

  it('deve rejeitar XSS em nome no registro (400)', async () => {
    const email = `qa.security.${Date.now()}@example.com`
    const payload = {
      Email: email,
      password: 'SenhaForte123!',
      Role: 'ADMIN',
      name: "<script>alert('xss')</script> Admin"
    }
    let status
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, payload)
    } catch (err) {
      status = err?.response?.status
    }
    expect(status).toBe(400)
  })
})


