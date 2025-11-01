/*
  Executável de verificação de sanitização
  Uso: API_BASE_URL=http://localhost:8080/api node scripts/test-sanitization.js
*/
const axios = require('axios')

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api'
const SERVER_BASE = API_BASE_URL.replace(/\/?api$/, '')

function nowId() {
  return Date.now().toString(36)
}

function containsDanger(s) {
  const v = String(s || '')
  return /<\s*script|javascript:\s*|on[a-z]+\s*=|--|\/\*|;/.test(v.toLowerCase())
}

async function checkHealth() {
  try {
    const [h1, h2] = await Promise.all([
      axios.get(`${SERVER_BASE}/health`, { timeout: 1000 }),
      axios.get(`${SERVER_BASE}/health/db`, { timeout: 1000 })
    ])
    return h1.status === 200 && h2.status === 200
  } catch {
    return false
  }
}

async function testRegisterXSS() {
  const email = `exec.xss.${nowId()}@example.com`
  const payload = {
    Email: email,
    password: 'SenhaForte123!',
    Role: 'ADMIN',
    name: "<script>alert('xss')</script> Admin"
  }
  const res = await axios.post(`${API_BASE_URL}/auth/register`, payload)
  const name = res.data?.name
  const ok = res.status === 201 && !containsDanger(name)
  return { ok, detail: ok ? 'XSS removido no name' : `XSS presente em name: ${name}` }
}

async function testRegisterSQLLike() {
  const email = `exec.sql.${nowId()}@example.com`
  const payload = {
    Email: email,
    password: 'SenhaForte123!',
    Role: 'ADMIN',
    name: 'Robert"); DROP TABLE Users; --'
  }
  const res = await axios.post(`${API_BASE_URL}/auth/register`, payload)
  const name = res.data?.name
  const dangerous = /;|--|\/\*/.test(String(name || ''))
  const ok = res.status === 201 && !dangerous
  return { ok, detail: ok ? 'Sequências SQL-like neutralizadas em name' : `SQL-like presente em name: ${name}` }
}

async function main() {
  const healthy = await checkHealth()
  if (!healthy) {
    console.warn('Aviso: /health ou /health/db indisponíveis. Prosseguindo mesmo assim...')
  }

  const results = []
  try {
    results.push(await testRegisterXSS())
  } catch (err) {
    const status = err?.response?.status
    results.push({ ok: false, detail: `Falha ao testar XSS: HTTP ${status || 'erro'} - ${err?.message}` })
  }
  try {
    results.push(await testRegisterSQLLike())
  } catch (err) {
    const status = err?.response?.status
    results.push({ ok: false, detail: `Falha ao testar SQL-like: HTTP ${status || 'erro'} - ${err?.message}` })
  }

  const allOk = results.every(r => r.ok)
  console.log('--- Sanitização ---')
  results.forEach((r, i) => console.log(`${i + 1}. ${r.ok ? 'OK' : 'FAIL'} - ${r.detail}`))
  if (!allOk) {
    console.error('Sanitização reprovada em pelo menos um caso.')
    process.exit(1)
  }
  console.log('Sanitização aprovada.')
}

main()
  .catch(err => {
    console.error('Erro inesperado:', err?.message)
    process.exit(1)
  })


