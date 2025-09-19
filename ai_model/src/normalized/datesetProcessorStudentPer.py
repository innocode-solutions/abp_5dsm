# =============================================================================
# 1. IMPORTAÇÕES E CARREGAMENTO DOS DADOS
# =============================================================================
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Carregar o dataset original
try:
    df = pd.read_csv('datasets/StudentPerformanceFactors.csv')
    print("✅ Dataset carregado com sucesso!")
except FileNotFoundError:
    print("❌ Erro: Arquivo 'datasets/StudentPerformanceFactors.csv' não encontrado.")
    # Criando um DataFrame de exemplo para o código não quebrar
    data = {
        'Gender': ['Male', 'Female', 'Male', None, 'Female'],
        'Parental_Education_Level': ['High School', 'College', 'Graduate Degree', 'High School', None],
        'Hours_Studied': [3, 5, 2, 6, 4],
        'Exam_Score': [75, 90, 65, 88, 82],
        'Access_to_Resources': ['Yes', 'No', 'Yes', 'Yes', 'No']
    }
    df = pd.DataFrame(data)
    print("ℹ️ Usando um DataFrame de exemplo para demonstração.")


# Análise inicial rápida
print("\nInformações do DataFrame e valores nulos:")
df.info()


# =============================================================================
# 2. DEFINIÇÃO DA ESTRATÉGIA DE PRÉ-PROCESSAMENTO
# =============================================================================
# Identificar colunas por tipo para aplicar as transformações corretas
# (Baseado nas colunas do seu código original)
categorical_features = df.select_dtypes(include=['object', 'category']).columns.tolist()
continuous_features = df.select_dtypes(include=['int64', 'float64']).columns.tolist()

# É uma boa prática remover a variável alvo (target) da lista de features
if 'Exam_Score' in continuous_features:
    continuous_features.remove('Exam_Score')

print("\nIdentificação das Features:")
print("🔹 Features Categóricas:", categorical_features)
print("🔸 Features Contínuas:", continuous_features)


# =============================================================================
# 3. CONSTRUÇÃO DO PIPELINE PRINCIPAL ⚙️
# =============================================================================
# Pipeline para features contínuas:
# Etapa 1: Tratar valores faltantes com a mediana (robusto a outliers)
# Etapa 2: Normalizar os dados (colocá-los na mesma escala)
continuous_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# Pipeline para features categóricas:
# Etapa 1: Tratar valores faltantes com o valor mais frequente
# Etapa 2: Aplicar One-Hot Encoding para transformar texto em números
categorical_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Combinador: Junta os pipelines e aplica cada um às colunas corretas
# É a nossa "linha de montagem" principal
preprocessor = ColumnTransformer(
    transformers=[
        ('num', continuous_pipeline, continuous_features),
        ('cat', categorical_pipeline, categorical_features)
    ],
    remainder='passthrough' # Mantém colunas não especificadas (se houver)
)

print("\n✅ Pipeline de pré-processamento construído!")


# =============================================================================
# 4. APLICAÇÃO E SALVAMENTO DO PIPELINE
# =============================================================================
# Separar as features (X) do alvo (y)
X = df.drop(columns='Exam_Score')
y = df['Exam_Score']

# "Treinar" o pipeline de pré-processamento com os dados.
# O pipeline aprende as medianas, desvios-padrão, categorias, etc.
# E ao mesmo tempo transforma os dados.
print("\nAplicando o pipeline aos dados (fit_transform)...")
X_preprocessed = preprocessor.fit_transform(X)

# O resultado é um array NumPy. Vamos convertê-lo de volta para um DataFrame
# para melhor visualização, usando os nomes de features gerados pelo pipeline.
processed_feature_names = preprocessor.get_feature_names_out()
X_preprocessed_df = pd.DataFrame(X_preprocessed, columns=processed_feature_names)

print("\nResultado após o pré-processamento (5 primeiras linhas):")


# Salvar o objeto do pipeline "treinado" em um arquivo
output_file = 'perf_preprocess.pkl'
joblib.dump(preprocessor, output_file)

print(f"\n✅ Pipeline final salvo com sucesso em '{output_file}'!")