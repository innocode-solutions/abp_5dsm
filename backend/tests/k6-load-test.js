import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================
let BASE_URL = __ENV.API_URL || __ENV.BASE_URL || 'https://localhost:8443';

if (!BASE_URL.endsWith('/api')) {
  BASE_URL = `${BASE_URL}/api`;
}

const API_URL = BASE_URL.replace('/api', '');
const BASE_PATH = '/api';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL;
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD;

// ============================================================================
// MÉTRICAS CUSTOMIZADAS
// ============================================================================
const errorRate = new Rate('errors');
const error4xxRate = new Rate('errors_4xx');
const error5xxRate = new Rate('errors_5xx');

const authLatency = new Trend('auth_latency');
const crudLatency = new Trend('crud_latency');
const dashboardLatency = new Trend('dashboard_latency');
const healthLatency = new Trend('health_latency');
const previsaoLatency = new Trend('previsao_latency');
const matriculaFormsLatency = new Trend('matricula_forms_latency');

const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

const loginDuration = new Trend('login_duration');
const getCursosDuration = new Trend('get_cursos_duration');
const createCursoDuration = new Trend('create_curso_duration');
const getDisciplinasDuration = new Trend('get_disciplinas_duration');
const getAlunosDuration = new Trend('get_alunos_duration');
const getPeriodosDuration = new Trend('get_periodos_duration');
const getMatriculasDuration = new Trend('get_matriculas_duration');
const dashboardProfessorDuration = new Trend('dashboard_professor_duration');
const dashboardProfessorResumoDuration = new Trend('dashboard_professor_resumo_duration');
const previsoesDuration = new Trend('previsoes_duration');

// ============================================================================
// CONFIGURAÇÃO DOS TESTES
// ============================================================================
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
      exec: 'smokeTest',
    },
    load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
      startTime: '1m',
      tags: { test_type: 'load' },
      exec: 'loadTest',
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      startTime: '4m',
      tags: { test_type: 'stress' },
      exec: 'stressTest',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      startTime: '6m',
      tags: { test_type: 'spike' },
      exec: 'spikeTest',
    },
  },
  thresholds: {
    'http_req_duration': [
      'p(50)<300',
      'p(95)<400',
      'p(99)<800',
      'avg<400',
    ],
    'http_req_failed': ['rate<0.05'],
    'errors_5xx': ['rate<0.01'],
    'auth_latency': ['avg<500', 'p(95)<800'],
    'crud_latency': ['avg<400', 'p(95)<600'],
    'dashboard_latency': ['avg<600', 'p(95)<1000'],
    'health_latency': ['avg<100', 'p(95)<200'],
    'previsao_latency': ['avg<800', 'p(95)<1200'],
    'matricula_forms_latency': ['avg<400', 'p(95)<600'],
    'login_duration': ['avg<400', 'p(95)<600'],
    'get_cursos_duration': ['avg<300', 'p(95)<500'],
    'dashboard_professor_duration': ['avg<600', 'p(95)<1000'],
    'dashboard_professor_resumo_duration': ['avg<400', 'p(95)<800'],
  },
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',
  insecureSkipTLSVerify: true,
  httpDebug: 'full',
};

// ============================================================================
// SETUP
// ============================================================================
export function setup() {
  console.log('🚀 Iniciando setup dos testes de carga...');
  console.log(`📍 API URL: ${API_URL}${BASE_PATH}`);
  console.log(`👤 Admin: ${ADMIN_EMAIL}`);

  console.log('🏥 Verificando health da API...');
  const healthRes = http.get(`${API_URL}/health`);
  
  if (healthRes.status !== 200) {
    console.error('❌ API não está saudável! Status:', healthRes.status);
    console.error('Response:', healthRes.body);
    throw new Error('API health check failed');
  }
  
  console.log('✅ API está saudável');

  console.log('🔐 Autenticando como admin...');
  const loginRes = http.post(
    `${API_URL}${BASE_PATH}/auth/login`,
    JSON.stringify({
      Email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200) {
    console.error('❌ Falha no login! Status:', loginRes.status);
    console.error('Response:', loginRes.body);
    throw new Error('Admin login failed');
  }

  const loginData = JSON.parse(loginRes.body);
  console.log('✅ Login realizado com sucesso');
  console.log(`🆔 User ID: ${loginData.user?.IDUser}`);
  console.log(`👤 User Role: ${loginData.user?.role}`);

  return {
    accessToken: loginData.token,
    refreshToken: loginData.refreshToken,
    userId: loginData.user?.IDUser,
    userRole: loginData.user?.role,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function validateResponse(response, expectedStatus, metricTrend, groupName) {
  const success = check(response, {
    [`${groupName}: status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${groupName}: response time < 1s`]: (r) => r.timings.duration < 1000,
    [`${groupName}: has body`]: (r) => r.body && r.body.length > 0,
  });

  if (metricTrend) {
    metricTrend.add(response.timings.duration);
  }

  if (response.status >= 500) {
    error5xxRate.add(1);
    errorRate.add(1);
    failedRequests.add(1);
  } else if (response.status >= 400) {
    error4xxRate.add(1);
    errorRate.add(1);
    failedRequests.add(1);
  } else {
    errorRate.add(0);
    error4xxRate.add(0);
    error5xxRate.add(0);
    successfulRequests.add(1);
  }

  return success;
}

function validateResponseMultiStatus(response, expectedStatuses, metricTrend, groupName) {
  const statusList = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  
  const success = check(response, {
    [`${groupName}: status is ${statusList.join(' or ')}`]: (r) => statusList.includes(r.status),
    [`${groupName}: response time < 1s`]: (r) => r.timings.duration < 1000,
  });

  if (metricTrend) {
    metricTrend.add(response.timings.duration);
  }

  if (response.status >= 500) {
    error5xxRate.add(1);
    errorRate.add(1);
    failedRequests.add(1);
  } else if (response.status >= 400 && !statusList.includes(response.status)) {
    error4xxRate.add(1);
    errorRate.add(1);
    failedRequests.add(1);
  } else {
    errorRate.add(0);
    successfulRequests.add(1);
  }

  return success;
}

function thinkTime(min = 1, max = 3) {
  sleep(Math.random() * (max - min) + min);
}

// ============================================================================
// SMOKE TEST
// ============================================================================
export function smokeTest(data) {
  group('Smoke Test - Validação Básica', () => {
    group('Health Check', () => {
      const res = http.get(`${API_URL}/health`);
      validateResponse(res, 200, healthLatency, 'Health');
    });

    group('Authentication', () => {
      const res = http.post(
        `${API_URL}${BASE_PATH}/auth/login`,
        JSON.stringify({
          Email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      validateResponse(res, 200, loginDuration, 'Login');
      authLatency.add(res.timings.duration);
    });

    thinkTime(1, 2);
  });
}

// ============================================================================
// LOAD TEST
// ============================================================================
export function loadTest(data) {
  const headers = getAuthHeaders(data.accessToken);

  group('Load Test - Operações CRUD', () => {
    group('GET Cursos', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/cursos`, { headers });
      validateResponse(res, 200, getCursosDuration, 'GET Cursos');
      crudLatency.add(res.timings.duration);
    });

    thinkTime();

    group('GET Disciplinas', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/disciplinas`, { headers });
      validateResponse(res, 200, getDisciplinasDuration, 'GET Disciplinas');
      crudLatency.add(res.timings.duration);
    });

    thinkTime();

    group('GET Alunos', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/alunos`, { headers });
      validateResponse(res, 200, getAlunosDuration, 'GET Alunos');
      crudLatency.add(res.timings.duration);
    });

    thinkTime();

    group('GET Matrículas', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/matriculas`, { headers });
      validateResponse(res, 200, getMatriculasDuration, 'GET Matrículas');
      crudLatency.add(res.timings.duration);
    });

    thinkTime(2, 4);
  });

  group('Load Test - Dashboards', () => {
    group('Dashboard Professor', () => {
      const res = http.get(
        `${API_URL}${BASE_PATH}/dashboard/professor/${data.userId}`,
        { headers }
      );
      validateResponse(res, 200, dashboardProfessorDuration, 'Dashboard Professor');
      dashboardLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);

    group('Dashboard Professor Resumo', () => {
      const res = http.get(
        `${API_URL}${BASE_PATH}/dashboard/professor/${data.userId}/resumo`,
        { headers }
      );
      validateResponse(res, 200, dashboardProfessorResumoDuration, 'Dashboard Professor Resumo');
      dashboardLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);
  });

  group('Load Test - Criação de Recursos', () => {
    group('POST Curso', () => {
      const payload = JSON.stringify({
        NomeDoCurso: `Curso Teste ${Date.now()}`,
        Descricao: 'Curso criado durante teste de carga'
      });
      
      const res = http.post(
        `${API_URL}${BASE_PATH}/cursos`,
        payload,
        { headers }
      );
      
      validateResponseMultiStatus(res, [201, 409], createCursoDuration, 'POST Curso');
      if (res.status === 201 || res.status === 409) {
        crudLatency.add(res.timings.duration);
      }
    });

    thinkTime(0.5, 1);

    group('POST Disciplina', () => {
      const cursosRes = http.get(`${API_URL}${BASE_PATH}/cursos?limit=1`, { headers });
      
      if (cursosRes.status === 200 && cursosRes.json().data && cursosRes.json().data.length > 0) {
        const cursoId = cursosRes.json().data[0].IDCurso;
        
        const payload = JSON.stringify({
          IDCurso: cursoId,
          NomeDaDisciplina: `Disciplina Teste ${Date.now()}`,
          CodigoDaDisciplina: `DISC${Math.floor(Math.random() * 10000)}`,
          CargaHoraria: 80,
          Ativa: true
        });
        
        const res = http.post(
          `${API_URL}${BASE_PATH}/disciplinas`,
          payload,
          { headers }
        );
        
        validateResponseMultiStatus(res, [201, 409], crudLatency, 'POST Disciplina');
      }
    });

    thinkTime(0.5, 1);
  });

  group('Load Test - Previsões ML', () => {
    group('POST Predictions', () => {
      const payload = JSON.stringify({
        cursoId: 1,
        periodoId: 1,
      });
      
      const res = http.post(
        `${API_URL}${BASE_PATH}/predictions`,
        payload,
        { headers }
      );
      
      validateResponseMultiStatus(res, [200, 201, 400], previsoesDuration, 'POST Predictions');
      previsaoLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);

    group('GET Predictions', () => {
      const res = http.get(
        `${API_URL}${BASE_PATH}/predictions?cursoId=1&periodoId=1`,
        { headers }
      );
      
      validateResponseMultiStatus(res, [200, 404], previsoesDuration, 'GET Predictions');
      previsaoLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);
  });
}

// ============================================================================
// STRESS TEST
// ============================================================================
export function stressTest(data) {
  const headers = getAuthHeaders(data.accessToken);

  group('Stress Test - Carga Alta', () => {
    group('GET Cursos', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/cursos`, { headers });
      validateResponse(res, 200, getCursosDuration, 'GET Cursos');
      crudLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);

    group('GET Disciplinas', () => {
      const res = http.get(`${API_URL}${BASE_PATH}/disciplinas`, { headers });
      validateResponse(res, 200, getDisciplinasDuration, 'GET Disciplinas');
      crudLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);

    group('Dashboard Professor', () => {
      const res = http.get(
        `${API_URL}${BASE_PATH}/dashboard/professor/${data.userId}`,
        { headers }
      );
      validateResponse(res, 200, dashboardProfessorDuration, 'Dashboard Professor');
      dashboardLatency.add(res.timings.duration);
    });

    thinkTime(0.5, 1);
  });
}

// ============================================================================
// SPIKE TEST
// ============================================================================
export function spikeTest(data) {
  const headers = getAuthHeaders(data.accessToken);

  group('Spike Test - Requisições Rápidas', () => {
    const healthRes = http.get(`${API_URL}/health`);
    check(healthRes, { 'health ok': (r) => r.status === 200 });
    
    const cursosRes = http.get(`${API_URL}${BASE_PATH}/cursos`, { headers });
    check(cursosRes, { 'cursos ok': (r) => r.status === 200 });
    
    const disciplinasRes = http.get(`${API_URL}${BASE_PATH}/disciplinas`, { headers });
    check(disciplinasRes, { 'disciplinas ok': (r) => r.status === 200 });
    
    sleep(0.5);
    
    const dashRes = http.get(`${API_URL}${BASE_PATH}/dashboard/professor/${data.userId}`, { headers });
    check(dashRes, { 'dashboard ok': (r) => r.status === 200 });
    
    const matriculasRes = http.get(`${API_URL}${BASE_PATH}/matriculas`, { headers });
    check(matriculasRes, { 'matriculas ok': (r) => r.status === 200 });
    
    sleep(0.5);
  });
}

// ============================================================================
// TEARDOWN
// ============================================================================
export function teardown(data) {
  console.log('🧹 Executando teardown...');
  console.log('✅ Teardown concluído');
}

// ============================================================================
// RELATÓRIOS CUSTOMIZADOS
// ============================================================================
export function handleSummary(data) {
  console.log('📊 Gerando relatórios...');

  const totalRequests = data.metrics.http_reqs?.values.count || 0;
  const failedRequests = data.metrics.http_req_failed?.values.passes || 0;
  const avgDuration = data.metrics.http_req_duration?.values.avg || 0;
  const minDuration = data.metrics.http_req_duration?.values.min || 0;
  const maxDuration = data.metrics.http_req_duration?.values.max || 0;
  const p50Duration = data.metrics.http_req_duration?.values.med || 0;
  const p95Duration = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const p99Duration = data.metrics.http_req_duration?.values['p(99)'] || 0;
  const error5xxRate = data.metrics.errors_5xx?.values.rate || 0;
  const error4xxRate = data.metrics.errors_4xx?.values.rate || 0;
  const errorRate = data.metrics.errors?.values.rate || 0;

  const criteriosAceite = {
    latenciaMedia: {
      valor: avgDuration,
      limite: 400,
      passou: avgDuration < 400,
      descricao: 'Latência média < 400ms',
      unidade: 'ms',
    },
    latenciaP95: {
      valor: p95Duration,
      limite: 400,
      passou: p95Duration < 400,
      descricao: 'P95 latência < 400ms',
      unidade: 'ms',
    },
    erros5xx: {
      valor: error5xxRate * 100,
      limite: 1,
      passou: error5xxRate < 0.01,
      descricao: 'Nenhum erro 5xx sob carga leve (<1%)',
      unidade: '%',
    },
    taxaSucesso: {
      valor: ((totalRequests - failedRequests) / totalRequests) * 100,
      limite: 95,
      passou: ((totalRequests - failedRequests) / totalRequests) >= 0.95,
      descricao: 'Taxa de sucesso >= 95%',
      unidade: '%',
    },
  };

  const todosCriteriosPassaram = Object.values(criteriosAceite).every(c => c.passou);

  const metricasPorEndpoint = {
    auth: {
      login: data.metrics.login_duration?.values.avg || 0,
    },
    crud: {
      cursos: data.metrics.get_cursos_duration?.values.avg || 0,
      disciplinas: data.metrics.get_disciplinas_duration?.values.avg || 0,
      alunos: data.metrics.get_alunos_duration?.values.avg || 0,
      periodos: data.metrics.get_periodos_duration?.values.avg || 0,
      matriculas: data.metrics.get_matriculas_duration?.values.avg || 0,
    },
    dashboards: {
      professor: data.metrics.dashboard_professor_duration?.values.avg || 0,
      professorResumo: data.metrics.dashboard_professor_resumo_duration?.values.avg || 0,
    },
    ml: {
      previsoes: data.metrics.previsoes_duration?.values.avg || 0,
    },
  };

  const customReport = {
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    testDuration: `${(data.state.testRunDurationMs / 1000).toFixed(2)}s`,
    resumo: {
      totalRequisicoes: totalRequests,
      requisicoesComSucesso: totalRequests - failedRequests,
      requisicoesFalhadas: failedRequests,
      taxaSucesso: `${(((totalRequests - failedRequests) / totalRequests) * 100).toFixed(2)}%`,
    },
    metricas: {
      latencia: {
        media: `${avgDuration.toFixed(2)}ms`,
        min: `${minDuration.toFixed(2)}ms`,
        max: `${maxDuration.toFixed(2)}ms`,
        p50: `${p50Duration.toFixed(2)}ms`,
        p95: `${p95Duration.toFixed(2)}ms`,
        p99: `${p99Duration.toFixed(2)}ms`,
      },
      throughput: {
        reqPorSegundo: (totalRequests / (data.state.testRunDurationMs / 1000)).toFixed(2),
      },
      erros: {
        total: `${(errorRate * 100).toFixed(2)}%`,
        erros4xx: `${(error4xxRate * 100).toFixed(2)}%`,
        erros5xx: `${(error5xxRate * 100).toFixed(2)}%`,
      },
    },
    metricasPorEndpoint: metricasPorEndpoint,
    criteriosAceite: criteriosAceite,
    resultado: todosCriteriosPassaram ? '✅ PASSOU' : '❌ FALHOU',
  };

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DOS TESTES DE CARGA');
  console.log('='.repeat(80));
  console.log(`\n🎯 Resultado Final: ${customReport.resultado}\n`);
  
  console.log('📈 Critérios de Aceite:');
  Object.entries(criteriosAceite).forEach(([key, criterio]) => {
    const status = criterio.passou ? '✅' : '❌';
    const valor = typeof criterio.valor === 'number' ? criterio.valor.toFixed(2) : criterio.valor;
    console.log(`  ${status} ${criterio.descricao}`);
    console.log(`     Valor: ${valor}${criterio.unidade} | Limite: ${criterio.limite}${criterio.unidade}`);
  });

  console.log('\n📊 Métricas Gerais:');
  console.log(`  Total de Requisições: ${totalRequests}`);
  console.log(`  Taxa de Sucesso: ${customReport.resumo.taxaSucesso}`);
  console.log(`  Duração Total: ${customReport.testDuration}`);
  console.log(`  Throughput: ${customReport.metricas.throughput.reqPorSegundo} req/s`);

  console.log('\n⏱️  Latência:');
  console.log(`  Média: ${customReport.metricas.latencia.media}`);
  console.log(`  Min: ${customReport.metricas.latencia.min}`);
  console.log(`  Max: ${customReport.metricas.latencia.max}`);
  console.log(`  P50: ${customReport.metricas.latencia.p50}`);
  console.log(`  P95: ${customReport.metricas.latencia.p95}`);
  console.log(`  P99: ${customReport.metricas.latencia.p99}`);

  console.log('\n❌ Erros:');
  console.log(`  Total: ${customReport.metricas.erros.total}`);
  console.log(`  4xx: ${customReport.metricas.erros.erros4xx}`);
  console.log(`  5xx: ${customReport.metricas.erros.erros5xx}`);

  console.log('\n🔍 Latência Média por Grupo:');
  console.log(`  Auth: ${metricasPorEndpoint.auth.login.toFixed(2)}ms (login)`);
  console.log(`  CRUD: ${metricasPorEndpoint.crud.cursos.toFixed(2)}ms (cursos)`);
  console.log(`  Dashboards: ${metricasPorEndpoint.dashboards.professor.toFixed(2)}ms (professor)`);
  console.log(`  Dashboards Resumo: ${metricasPorEndpoint.dashboards.professorResumo.toFixed(2)}ms (professor resumo)`);
  console.log(`  ML: ${metricasPorEndpoint.ml.previsoes.toFixed(2)}ms (previsões)`);
  
  console.log('\n' + '='.repeat(80) + '\n');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data, null, 2),
    'custom-report.json': JSON.stringify(customReport, null, 2),
  };
}