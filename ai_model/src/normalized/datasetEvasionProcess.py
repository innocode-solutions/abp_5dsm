#==============================================================================
# Script para processar o dataset xAPI-Edu-Data e criar lable binária de evasão
# Objetivo: Criar a variável alvo 'dropout_label' indicando evasão escolar
# e preparar o pipeline de pré-processamento dos dados.
#==============================================================================

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib

# 1. Carregar dataset
df = pd.read_csv("../datasets/xAPI-Edu-Data.csv")

# 2. Tratar valores nulos (drop ou imputação simples)
df = df.dropna()

# 3. Criar variável alvo binária dropout_label
def define_dropout(row):
    if row["StudentAbsenceDays"] == "Above-7":
        if (row["raisedhands"] < 50 and 
            row["VisITedResources"] < 50 and 
            row["AnnouncementsView"] < 30 and 
            row["Discussion"] < 20):
            return 1  # evasão
    return 0  # permanece

df["dropout_label"] = df.apply(define_dropout, axis=1)

# 4. Separar features (X) e target (y)
X = df.drop(["Class", "dropout_label"], axis=1)
y = df["dropout_label"]

# 5. Identificar variáveis categóricas e numéricas
categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numeric_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

# 6. Definir transformações
categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

# 7. Criar ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ("categorical", categorical_transformer, categorical_cols),
        ("numeric", numeric_transformer, numeric_cols),
    ]
)

# 8. Criar pipeline final
pipeline = Pipeline(steps=[("preprocessor", preprocessor)])

# 9. Ajustar pipeline aos dados
pipeline.fit(X)

# 10. Transformar dados
X_processed = pipeline.transform(X)

# 11. Validar se não restam valores nulos
from scipy import sparse

X_df = pd.DataFrame(
    X_processed.toarray() if sparse.issparse(X_processed) else X_processed
)
assert X_df.isnull().sum().sum() == 0, "Ainda existem valores nulos!"

# 12. Salvar pipeline para reuso
joblib.dump(pipeline, "../pipelines/dropout_preprocess.pkl")

# 13. Exportar dataset com label já criada
df.to_csv("../datasets/xAPI_dropout.csv", index=False)

print("✅ Dataset exportado com coluna dropout_label em xAPI_dropout.csv")
print("✅ Pipeline salvo em dropout_preprocess.pkl")
print("Distribuição do target:")
print(df["dropout_label"].value_counts(normalize=True))
