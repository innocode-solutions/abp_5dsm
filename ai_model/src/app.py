# =============================================================================
# ARQUIVO: src/app.py
# OBJETIVO: Ponto de entrada da API com FastAPI. Aceita valores de string 
#           categóricos e os valida usando Enums.
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from enum import Enum
from pathlib import Path

# Supondo que sua classe de serviço esteja em models/preview.py
from src.models.preview import PredictionService 

# --- DEFINIÇÃO DOS VALORES CATEGÓRICOS ACEITOS (Enums) ---
# Usar Enums garante que a API só aceite os valores pré-definidos para cada campo.

class BinaryChoice(str, Enum):
    yes = "Yes"
    no = "No"

class GenderEnum(str, Enum):
    male = "Male"
    female = "Female"

class Level(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class Distance(str, Enum):
    near = "Near"
    far = "Far"

class EducationLevel(str, Enum):
    none = "None"
    high_school = "High School"
    some_college = "Some College"
    bachelors = "Bachelor's"
    masters = "Master's"

class SchoolType(str, Enum):
    public = "Public"
    private = "Private"

class PeerInfluenceEnum(str, Enum):
    positive = "Positive"
    negative = "Negative"
    neutral = "Neutral"

class ResourceAccess(str, Enum):
    poor = "Poor"
    average = "Average"
    good = "Good"

class TeacherQualityEnum(str, Enum):
    poor = "Poor"
    average = "Average"
    good = "Good"

# --- MODELO DE DADOS (Validação com Pydantic) ---
# Atualizado para usar os Enums e os tipos de dados corretos.
class StudentData(BaseModel):
    Hours_Studied: float
    Previous_Scores: float
    Sleep_Hours: float
    Distance_from_Home: Distance
    Attendance: float
    Gender: GenderEnum
    Parental_Education_Level: EducationLevel
    Parental_Involvement: Level
    School_Type: SchoolType
    Peer_Influence: PeerInfluenceEnum
    Extracurricular_Activities: BinaryChoice
    Learning_Disabilities: BinaryChoice
    Internet_Access: BinaryChoice
    Access_to_Resources: ResourceAccess
    Teacher_Quality: TeacherQualityEnum
    Family_Income: Level
    Motivation_Level: Level
    Tutoring_Sessions: BinaryChoice
    Physical_Activity: Level

# --- CONFIGURAÇÕES E INICIALIZAÇÃO DO SERVIÇO ---
BASE_DIR = Path(__file__).resolve().parent

PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"
LOGREG_PATH = BASE_DIR / "pipelines" / "perf_logreg_model.pkl"
RF_PATH = BASE_DIR / "pipelines" / "perf_rf_model.pkl"
DATA_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"


try:
    prediction_service = PredictionService(PREPROCESSOR_PATH, LOGREG_PATH, RF_PATH, DATA_PATH)
except Exception as e:
    print(f"Não foi possível iniciar o serviço de predição. Erro: {e}")
    prediction_service = None

# --- CRIAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="API de Predição de Desempenho de Alunos",
    description="Uma API para prever o desempenho de alunos usando modelos de Machine Learning.",
    version="1.1.0"
)

# --- DEFINIÇÃO DA ROTA DA API ---
@app.post('/predict/performance', summary="Gera um relatório de predição de desempenho")
def predict(student_data: StudentData):
    """
    Recebe os dados do aluno em formato de texto categórico e retorna o relatório.
    """
    if not prediction_service:
        raise HTTPException(
            status_code=503, 
            detail="Serviço não está disponível devido a um erro na inicialização."
        )

    try:
        # student_data.dict() converte o modelo (incluindo os enums)
        # em um dicionário de strings e números, pronto para ser usado
        # pelo seu pipeline de pré-processamento.
        student_data_dict = student_data.dict()
        
        report = prediction_service.generate_report(student_data_dict)
        return report
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ocorreu um erro ao processar a requisição: {str(e)}"
        )

# Para executar, use o comando no terminal na raiz do projeto:
# uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload