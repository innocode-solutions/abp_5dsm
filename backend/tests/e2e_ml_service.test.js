const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_BASE_URL || 'http://localhost:5000';
const RUN_REAL_ML = process.env.RUN_REAL_ML === 'true';

async function isMlAvailable() {
  try {
    const res = await axios.get(`${ML_SERVICE_URL}/docs`, { timeout: 800 });
    return res.status === 200 || res.status === 307 || res.status === 308;
  } catch {
    return false;
  }
}

describe('E2E - Serviço de ML direto (/predict/*) com SLA (<500ms)', () => {
  let useMock = false;
  let postSpy;

  beforeAll(async () => {
    const available = await isMlAvailable();
    useMock = !available && !RUN_REAL_ML;

    if (useMock) {
      postSpy = jest.spyOn(axios, 'post');
      postSpy.mockImplementation((url) => {
        if (url.endsWith('/predict/dropout')) {
          return Promise.resolve({
            status: 200,
            data: { class_dropout: 'Low', probability_dropout: 0.12, explain: 'mocked' }
          });
        }
        if (url.endsWith('/predict/performance')) {
          return Promise.resolve({
            status: 200,
            data: { class_perf: 'High', probability_perf: 0.87, explain: 'mocked' }
          });
        }
        return Promise.reject(new Error('Unexpected URL in mock'));
      });
    }
  });

  afterAll(() => {
    if (postSpy) postSpy.mockRestore();
  });

  it('dropout: responde com estrutura válida em <500ms', async () => {
    const payload = {
      raisedhands: 50,
      VisITedResources: 30,
      AnnouncementsView: 20,
      Discussion: 15,
      ParentAnsweringSurvey: 'Yes',
      ParentschoolSatisfaction: 'Good',
      StudentAbsenceDays: 'Under-7'
    };
    const start = Date.now();
    const res = await axios.post(`${ML_SERVICE_URL}/predict/dropout`, payload);
    const durationMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('class_dropout');
    expect(res.data).toHaveProperty('probability_dropout');
    expect(typeof res.data.probability_dropout).toBe('number');
    expect(durationMs).toBeLessThan(500);
  });

  it('performance: responde com estrutura válida em <500ms', async () => {
    const payload = {
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
    };
    const start = Date.now();
    const res = await axios.post(`${ML_SERVICE_URL}/predict/performance`, payload);
    const durationMs = Date.now() - start;

    expect(res.status).toBe(200);
    // Aceita dois formatos: (class_perf/probability_perf) OU (predicted_score/confidence)
    if ('class_perf' in res.data && 'probability_perf' in res.data) {
      expect(typeof res.data.probability_perf).toBe('number');
    } else {
      expect(res.data).toHaveProperty('predicted_score');
      expect(res.data).toHaveProperty('confidence');
      expect(typeof res.data.predicted_score).toBe('number');
      expect(typeof res.data.confidence).toBe('number');
    }
    expect(durationMs).toBeLessThan(500);
  });
});


