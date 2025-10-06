# =============================================================================
# ARQUIVO: src/app.py
# OBJETIVO: API FastAPI com suporte a predição direta ou via ID de aluno
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from enum import Enum
from pathlib import Path
import pandas as pd

# Serviços de ML
from src.models.dropout_service import DropoutService
from src.models.preview import PredictionService

# =============================================================================
# MODELOS DE ENTRADA
# =============================================================================

class BinaryChoice(str, Enum):
    yes = "Yes"
    no = "No"

class SatisfactionLevel(str, Enum):
    good = "Good"
    bad = "Bad"

class AbsenceDays(str, Enum):
    # Valores conforme o dataset original
    low = "Under-7"       # Menos de 7 faltas
    high = "Above-7"      # 7 faltas ou mais


# ==============================================================
# MODELO DE ENTRADA PARA PREDIÇÃO DE EVASÃO
# ==============================================================

class DropoutData(BaseModel):
    raisedhands: int                 # Quantidade de vezes que o aluno levantou a mão
    VisITedResources: int            # Quantidade de recursos visitados
    AnnouncementsView: int           # Quantidade de anúncios visualizados
    Discussion: int                  # Participações em discussões
    ParentAnsweringSurvey: BinaryChoice   # Pais responderam pesquisa (Yes/No)
    ParentschoolSatisfaction: SatisfactionLevel  # Satisfação dos pais (Good/Bad)
    StudentAbsenceDays: AbsenceDays          # Faixa de faltas do aluno

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


# =============================================================================
# CONFIGURAÇÃO DE CAMINHOS E CARREGAMENTO DE DATASETS
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent
DATA_DROP = BASE_DIR / "datasets" / "xAPI_dropout.csv"
DATA_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"

df_dropout = pd.read_csv(DATA_DROP)
df_performance = pd.read_csv(DATA_PATH)

# =============================================================================
# CARREGAMENTO DOS MODELOS
# =============================================================================
DROP_PREPROCESS = BASE_DIR / "pipelines" / "dropout_preprocess.pkl"
DROP_MODEL = BASE_DIR / "pipelines" / "dropout_logreg_model.pkl"
PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"
LOGREG_PATH = BASE_DIR / "pipelines" / "perf_logreg_model.pkl"
RF_PATH = BASE_DIR / "pipelines" / "perf_rf_model.pkl"

try:
    dropout_service = DropoutService(DROP_PREPROCESS, DROP_MODEL)
except Exception as e:
    print(f"Não foi possível iniciar o serviço de predição. Erro: {e}")
    dropout_service = None

try:
    prediction_service = PredictionService(PREPROCESSOR_PATH, LOGREG_PATH, RF_PATH, DATA_PATH)
except Exception as e:
    print(f"Não foi possível iniciar o serviço de predição. Erro: {e}")
    prediction_service = None


# =============================================================================
# INICIALIZAÇÃO DA API
# =============================================================================
app = FastAPI(
    title="API de Predição Acadêmica",
    description=(
        "API que prevê **risco de evasão** e **desempenho acadêmico** "
        "com base em dados reais de alunos."
    ),
    version="2.1.0"
)

# =============================================================================
# ROTAS DA API
# =============================================================================

@app.post("/predict/dropout", summary="Prediz risco de evasão do aluno")
def predict_dropout(data: DropoutData):
    """
    Recebe os dados de um aluno e retorna o risco de evasão previsto.
    """
    if not dropout_service:
        raise HTTPException(
            status_code=503,
            detail="Serviço de evasão indisponível devido a erro na inicialização."
        )

    try:
        # Converte o objeto Pydantic em dicionário limpo para o modelo
        student_data_dict = data.dict()

        # Realiza a predição
        prediction = dropout_service.predict_dropout(student_data_dict)

        return prediction

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ocorreu um erro ao processar a predição: {str(e)}"
        )

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