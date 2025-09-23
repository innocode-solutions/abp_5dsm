# =============================================================================
# ARQUIVO: 1_criar_preprocessador.py
# OBJETIVO: Criar, treinar e salvar o pipeline de pré-processamento de dados.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def build_and_save_preprocessor(datapath, output_path):
    """
    Carrega os dados, cria e treina um pipeline de pré-processamento
    e o salva em um arquivo.
    """
    # Carregar os dados brutos
    try:
        df = pd.read_csv(datapath)
        print(f"✅ Dataset '{datapath}' carregado com sucesso!")
    except FileNotFoundError:
        print(f"❌ Erro: Arquivo '{datapath}' não encontrado.")
        return

    # Separar features do alvo para o split
    X = df.drop(columns='Exam_Score')
    y = df['Exam_Score']
    
    # É crucial treinar o pré-processador apenas com os dados de treino
    # para evitar vazamento de dados (data leakage) do conjunto de teste.
    X_train, _, _, _ = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"✅ Usando {len(X_train)} amostras de treino para 'aprender' o pré-processamento.")

    # Identificar tipos de colunas a partir dos dados de treino
    categorical_features = X_train.select_dtypes(include=['object', 'category']).columns.tolist()
    continuous_features = X_train.select_dtypes(include=['int64', 'float64']).columns.tolist()

    # Construir os pipelines
    continuous_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    categorical_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Criar o ColumnTransformer (o pré-processador principal)
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', continuous_pipeline, continuous_features),
            ('cat', categorical_pipeline, categorical_features)
        ],
        remainder='passthrough'
    )
    
    # Treinar o pré-processador com os dados de treino
    preprocessor.fit(X_train)
    print("\n✅ Pipeline de pré-processamento treinado com sucesso!")
    
    # Salvar o objeto treinado
    joblib.dump(preprocessor, output_path)
    print(f"💾 Pipeline salvo em '{output_path}'!")


if __name__ == "__main__":
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_OUTPUT_PATH = 'perf_preprocess.pkl'
    
    build_and_save_preprocessor(DATASET_PATH, PREPROCESSOR_OUTPUT_PATH)