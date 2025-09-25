# =============================================================================
# ARQUIVO: 1_criar_preprocessador.py (VERSÃO FINAL E CORRIGIDA)
# OBJETIVO: Criar, treinar e salvar o pipeline de pré-processamento.
# =============================================================================

import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# --- CONFIGURAÇÕES ---
DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
PREPROCESSOR_PATH = 'perf_preprocess.pkl'

print("Iniciando a criação do pré-processador...")

try:
    df = pd.read_csv(DATASET_PATH)
    print("✅ Dataset carregado com sucesso.")
except FileNotFoundError:
    print(f"❌ ERRO: O arquivo '{DATASET_PATH}' não foi encontrado.")
    exit()

X = df.drop('Exam_Score', axis=1)

# 1. Definir manualmente as colunas (forma mais segura)
#    Isso resolve o erro 'ValueError: Cannot use median strategy...'
numeric_features = [
    'Hours_Studied',
    'Previous_Scores',
    'Sleep_Hours',
    'Attendance'
]

categorical_features = [
    'Gender',
    'Parental_Education_Level',
    'Parental_Involvement',
    'School_Type',
    'Peer_Influence',
    'Extracurricular_Activities',
    'Learning_Disabilities',
    'Internet_Access',
    'Access_to_Resources',
    'Teacher_Quality',
    'Family_Income',
    'Motivation_Level',
    'Tutoring_Sessions',
    'Physical_Activity',
    'Distance_from_Home'  # Movido para categóricas, pois contém 'Near', 'Far', etc.
]

print(f"Usando {len(numeric_features)} features numéricas e {len(categorical_features)} categóricas.")


# 2. Criar pipelines específicos para cada tipo de dado
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# 3. Juntar os pipelines com o ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ],
    remainder='drop'
)

# 4. Treinar o pré-processador
print("Treinando o pré-processador...")
preprocessor.fit(X)
print("✅ Pré-processador treinado com sucesso.")

# 5. Salvar o novo objeto
joblib.dump(preprocessor, PREPROCESSOR_PATH)
print(f"💾 Novo pré-processador salvo em '{PREPROCESSOR_PATH}'.")