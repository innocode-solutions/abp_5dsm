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

@app.get("/health", summary="Health check da API")
def health_check():
    """
    Endpoint para verificar se a API está funcionando.
    """
    return {
        "status": "OK",
        "message": "API de Predição Acadêmica funcionando",
        "version": "2.1.0",
        "services": {
            "dropout_service": "OK" if dropout_service else "ERROR",
            "prediction_service": "OK" if prediction_service else "ERROR"
        },
        "timestamp": "2024-01-15T10:30:00.000Z"
    }

@app.get("/", summary="Informações da API")
def root():
    """
    Endpoint raiz com informações da API.
    """
    return {
        "title": "API de Predição Acadêmica",
        "description": "API que prevê risco de evasão e desempenho acadêmico",
        "version": "2.1.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "dropout_prediction": {
                "POST": "/predict/dropout",
                "GET": "/predict/dropout",
                "PUT": "/predict/dropout",
                "DELETE": "/predict/dropout"
            },
            "performance_prediction": {
                "POST": "/predict/performance",
                "GET": "/predict/performance",
                "PUT": "/predict/performance",
                "DELETE": "/predict/performance"
            }
        },
        "status": "OK" if (dropout_service and prediction_service) else "PARTIAL"
    }

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

@app.get("/predict/dropout", summary="Obtém predição de evasão (mesmo que POST)")
def get_dropout_prediction(data: DropoutData):
    """
    Obtém a predição de evasão com os mesmos parâmetros do POST.
    """
    if not dropout_service:
        raise HTTPException(
            status_code=503,
            detail="Serviço de evasão indisponível devido a erro na inicialização."
        )

    try:
        student_data_dict = data.dict()
        prediction = dropout_service.predict_dropout(student_data_dict)
        return prediction

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ocorreu um erro ao processar a predição: {str(e)}"
        )

@app.put("/predict/dropout", summary="Atualiza/recalcula predição de evasão")
def update_dropout_prediction(data: DropoutData):
    """
    Atualiza ou recalcula a predição de evasão com novos dados.
    """
    if not dropout_service:
        raise HTTPException(
            status_code=503,
            detail="Serviço de evasão indisponível devido a erro na inicialização."
        )
    
    try:
        student_data_dict = data.dict()
        prediction = dropout_service.predict_dropout(student_data_dict)
        
        return {
            "message": "Predição atualizada com sucesso",
            "prediction": prediction
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ocorreu um erro ao atualizar a predição: {str(e)}"
        )

@app.delete("/predict/dropout", summary="Remove/limpa dados de predição de evasão")
def delete_dropout_prediction(data: DropoutData):
    """
    Endpoint DELETE para predição de evasão (retorna confirmação).
    """
    try:
        return {
            "message": "Dados de predição de evasão removidos com sucesso",
            "data": data.dict()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ocorreu um erro ao processar a requisição: {str(e)}"
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
        report["saved"] = False  # Por padrão, não salva
            
        return report
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ocorreu um erro ao processar a requisição: {str(e)}"
        )

@app.get("/predict/performance", summary="Obtém informações sobre predição de desempenho")
def get_performance_info():
    """
    Retorna informações sobre o endpoint de predição de desempenho.
    """
    return {
        "message": "Use POST /predict/performance para fazer predições",
        "required_fields": [
            "Hours_Studied", "Previous_Scores", "Sleep_Hours", "Distance_from_Home",
            "Attendance", "Gender", "Parental_Education_Level", "Parental_Involvement",
            "School_Type", "Peer_Influence", "Extracurricular_Activities",
            "Learning_Disabilities", "Internet_Access", "Access_to_Resources",
            "Teacher_Quality", "Family_Income", "Motivation_Level",
            "Tutoring_Sessions", "Physical_Activity"
        ],
        "example_approved": {
            "Hours_Studied": 6.0,
            "Previous_Scores": 85.0,
            "Sleep_Hours": 8.0,
            "Distance_from_Home": "Near",
            "Attendance": 95.0,
            "Gender": "Male",
            "Parental_Education_Level": "Bachelor's",
            "Parental_Involvement": "High",
            "School_Type": "Public",
            "Peer_Influence": "Positive",
            "Extracurricular_Activities": "Yes",
            "Learning_Disabilities": "No",
            "Internet_Access": "Yes",
            "Access_to_Resources": "Good",
            "Teacher_Quality": "Good",
            "Family_Income": "High",
            "Motivation_Level": "High",
            "Tutoring_Sessions": "No",
            "Physical_Activity": "High"
        },
        "example_failed": {
            "Hours_Studied": 2.0,
            "Previous_Scores": 45.0,
            "Sleep_Hours": 5.0,
            "Distance_from_Home": "Far",
            "Attendance": 60.0,
            "Gender": "Female",
            "Parental_Education_Level": "None",
            "Parental_Involvement": "Low",
            "School_Type": "Public",
            "Peer_Influence": "Negative",
            "Extracurricular_Activities": "No",
            "Learning_Disabilities": "Yes",
            "Internet_Access": "No",
            "Access_to_Resources": "Poor",
            "Teacher_Quality": "Poor",
            "Family_Income": "Low",
            "Motivation_Level": "Low",
            "Tutoring_Sessions": "Yes",
            "Physical_Activity": "Low"
        }
    }

@app.put("/predict/performance", summary="Atualiza/recalcula relatório de desempenho")
def update_performance_prediction(student_data: StudentData):
    """
    Atualiza ou recalcula o relatório de desempenho com novos dados.
    """
    if not prediction_service:
        raise HTTPException(
            status_code=503, 
            detail="Serviço não está disponível devido a um erro na inicialização."
        )
    
    try:
        student_data_dict = student_data.dict()
        report = prediction_service.generate_report(student_data_dict)
        
        return {
            "message": "Relatório atualizado com sucesso",
            "report": report
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ocorreu um erro ao atualizar o relatório: {str(e)}"
        )

@app.delete("/predict/performance", summary="Remove/limpa dados de relatório de desempenho")
def delete_performance_prediction(student_data: StudentData):
    """
    Endpoint DELETE para relatório de desempenho (retorna confirmação).
    """
    try:
        return {
            "message": "Dados de relatório de desempenho removidos com sucesso",
            "data": student_data.dict()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ocorreu um erro ao processar a requisição: {str(e)}"
        )

# Para executar, use o comando no terminal na raiz do projeto:
# uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload

