import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

# 1. Carregar dataset
df = pd.read_csv("datasets/xAPI-Evasion.csv")

# 2. Tratar valores nulos (drop ou imputação simples)
df = df.dropna()  # nesse dataset geralmente não há nulos, mas garantimos

# 3. Separar features e target
# Supondo que "Class" represente o desempenho/alvo original,
# mas queremos prever evasão → usaremos StudentAbsenceDays como proxy.
X = df.drop("Class", axis=1)
y = df["StudentAbsenceDays"]  # alvo: ausência (pode ser binário ou ordinal)

# 4. Identificar variáveis categóricas e numéricas
categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numeric_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

# 5. Definir transformações
categorical_transformer = OneHotEncoder(handle_unknown="ignore")
numeric_transformer = StandardScaler()

# 6. Criar ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ("categorical", categorical_transformer, categorical_cols),
        ("numeric", numeric_transformer, numeric_cols),
    ]
)

# 7. Pipeline final
pipeline = Pipeline(steps=[("preprocessor", preprocessor)])

# 8. Ajustar pipeline aos dados
pipeline.fit(X)

# 9. Transformar (garantir que não tenha nulos depois)
X_processed = pipeline.transform(X)
assert pd.DataFrame(X_processed.toarray() if hasattr(X_processed, "toarray") else X_processed).isnull().sum().sum() == 0, "Ainda existem valores nulos!"

# 10. Salvar pipeline para reuso
joblib.dump(pipeline, "dropout_preprocess.pkl")

print("✅ Pré-processamento concluído e salvo em dropout_preprocess.pkl")
