import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface PredictionRequest {
  IDMatricula: string;
  dados: {
    Hours_Studied: number;
    Previous_Scores: number;
    Sleep_Hours: number;
    Distance_from_Home: string;
    Attendance: number;
    Gender: string;
    Parental_Education_Level: string;
    Parental_Involvement: string;
    School_Type: string;
    Peer_Influence: string;
    Extracurricular_Activities: string;
    Learning_Disabilities: string;
    Internet_Access: string;
    Access_to_Resources: string;
    Teacher_Quality: string;
    Family_Income: string;
    Motivation_Level: string;
    Tutoring_Sessions: string;
    Physical_Activity: string;
  };
}

export interface PredictionResponse {
  success: boolean;
  message: string;
  data: {
    IDPrediction: string;
    IDMatricula: string;
    TipoPredicao: string;
    predicted_score: number; // 0-100
    Probabilidade: number; // 0-1
    Classificacao: string;
    approval_status: string;
    grade_category: string;
    Explicacao: string;
    disciplina: {
      IDDisciplina: string;
      NomeDaDisciplina: string;
      CodigoDaDisciplina?: string;
    };
    periodo: {
      IDPeriodo: string;
      Nome: string;
    };
    createdAt: string;
  };
}

export async function createStudentPrediction(
  request: PredictionRequest
): Promise<PredictionResponse> {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`${API_URL}/v1/predictions/student/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao criar predição: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao criar predição');
  }
}

export async function getStudentPredictions(matriculaId: string) {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`${API_URL}/v1/predictions/matricula/${matriculaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao buscar predições: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao buscar predições');
  }
}

