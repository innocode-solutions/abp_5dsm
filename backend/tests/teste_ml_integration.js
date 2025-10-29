const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const ML_SERVICE_URL = 'http://localhost:5000';

async function testMLService() {
  console.log('=== Testando Serviço de ML ===\n');

  try {
    console.log('1. Testando endpoint de evasão do ML...');
    const dropoutResponse = await axios.post(`${ML_SERVICE_URL}/predict/dropout`, {
      raisedhands: 50,
      VisITedResources: 30,
      AnnouncementsView: 20,
      Discussion: 15,
      ParentAnsweringSurvey: "Yes",
      ParentschoolSatisfaction: "Good",
      StudentAbsenceDays: "Under-7"
    });
    console.log('✓ Serviço de evasão respondeu:', dropoutResponse.data);
  } catch (error) {
    console.log('✗ Erro ao testar serviço de evasão:', error.message);
  }

  try {
    console.log('\n2. Testando endpoint de desempenho do ML...');
    const performanceResponse = await axios.post(`${ML_SERVICE_URL}/predict/performance`, {
      Hours_Studied: 6.0,
      Previous_Scores: 85.0,
      Sleep_Hours: 8.0,
      Distance_from_Home: "Near",
      Attendance: 95.0,
      Gender: "Male",
      Parental_Education_Level: "Bachelor's",
      Parental_Involvement: "High",
      School_Type: "Public",
      Peer_Influence: "Positive",
      Extracurricular_Activities: "Yes",
      Learning_Disabilities: "No",
      Internet_Access: "Yes",
      Access_to_Resources: "Good",
      Teacher_Quality: "Good",
      Family_Income: "High",
      Motivation_Level: "High",
      Tutoring_Sessions: "No",
      Physical_Activity: "High"
    });
    console.log('✓ Serviço de desempenho respondeu:', performanceResponse.data);
  } catch (error) {
    console.log('✗ Erro ao testar serviço de desempenho:', error.message);
  }
}

async function testPredictionIntegration(token, matriculaId) {
  console.log('\n=== Testando Integração Backend + ML ===\n');

  if (!token) {
    console.log('⚠ Token JWT não fornecido. Pule este teste ou forneça um token válido.');
    return;
  }

  if (!matriculaId) {
    console.log('⚠ ID de matrícula não fornecido. Pule este teste ou forneça um ID válido.');
    return;
  }

  try {
    console.log('3. Testando criação de predição de evasão com ML...');
    const dropoutPrediction = await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: "EVASAO",
        dados: {
          raisedhands: 50,
          VisITedResources: 30,
          AnnouncementsView: 20,
          Discussion: 15,
          ParentAnsweringSurvey: "Yes",
          ParentschoolSatisfaction: "Good",
          StudentAbsenceDays: "Under-7"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✓ Predição de evasão criada:', dropoutPrediction.data);
  } catch (error) {
    if (error.response) {
      console.log('✗ Erro ao criar predição de evasão:', error.response.data);
    } else {
      console.log('✗ Erro ao criar predição de evasão:', error.message);
    }
  }

  try {
    console.log('\n4. Testando criação de predição de desempenho com ML...');
    const performancePrediction = await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: "DESEMPENHO",
        dados: {
          Hours_Studied: 6.0,
          Previous_Scores: 85.0,
          Sleep_Hours: 8.0,
          Distance_from_Home: "Near",
          Attendance: 95.0,
          Gender: "Male",
          Parental_Education_Level: "Bachelor's",
          Parental_Involvement: "High",
          School_Type: "Public",
          Peer_Influence: "Positive",
          Extracurricular_Activities: "Yes",
          Learning_Disabilities: "No",
          Internet_Access: "Yes",
          Access_to_Resources: "Good",
          Teacher_Quality: "Good",
          Family_Income: "High",
          Motivation_Level: "High",
          Tutoring_Sessions: "No",
          Physical_Activity: "High"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✓ Predição de desempenho criada:', performancePrediction.data);
  } catch (error) {
    if (error.response) {
      console.log('✗ Erro ao criar predição de desempenho:', error.response.data);
    } else {
      console.log('✗ Erro ao criar predição de desempenho:', error.message);
    }
  }
}

async function testErrorHandling(token) {
  console.log('\n=== Testando Tratamento de Erros ===\n');

  if (!token) {
    console.log('⚠ Token JWT não fornecido. Pule este teste ou forneça um token válido.');
    return;
  }

  try {
    console.log('5. Testando com matrícula inexistente...');
    await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: "00000000-0000-0000-0000-000000000000",
        TipoPredicao: "EVASAO",
        dados: {
          raisedhands: 50,
          VisITedResources: 30,
          AnnouncementsView: 20,
          Discussion: 15,
          ParentAnsweringSurvey: "Yes",
          ParentschoolSatisfaction: "Good",
          StudentAbsenceDays: "Under-7"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✓ Erro 404 retornado corretamente:', error.response.data);
    } else {
      console.log('✗ Erro inesperado:', error.message);
    }
  }

  try {
    console.log('\n6. Testando com tipo de predição inválido...');
    await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: "some-id",
        TipoPredicao: "INVALIDO",
        dados: {}
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✓ Erro 400 retornado corretamente:', error.response.data);
    } else {
      console.log('✗ Erro inesperado:', error.message);
    }
  }

  try {
    console.log('\n7. Testando com campos obrigatórios faltando...');
    await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: "some-id"
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✓ Erro 400 retornado corretamente:', error.response.data);
    } else {
      console.log('✗ Erro inesperado:', error.message);
    }
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Teste de Integração: Backend + Serviço de ML             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const token = process.argv[2];
  const matriculaId = process.argv[3];

  await testMLService();
  await testPredictionIntegration(token, matriculaId);
  await testErrorHandling(token);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Testes Concluídos                                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nUso: node teste_ml_integration.js [TOKEN_JWT] [ID_MATRICULA]');
  console.log('Exemplo: node teste_ml_integration.js eyJhbGc... abc-123-def\n');
}

runTests();
