#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para retreinar o pré-processador SEM o campo Previous_Scores
Isso evita viés no modelo - o modelo não deve usar notas anteriores para prever
"""

import sys
import pandas as pd
import joblib
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Configuração de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"
PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"

def main():
    print("=" * 60)
    print("RETREINANDO PRÉ-PROCESSADOR SEM Previous_Scores")
    print("=" * 60)
    
    # Carregar dataset
    try:
        df = pd.read_csv(DATASET_PATH)
        print(f"✅ Dataset carregado: {len(df)} registros")
    except FileNotFoundError:
        print(f"❌ Erro: Dataset não encontrado em {DATASET_PATH}")
        sys.exit(1)
    
    # Separar features e target
    # REMOVER Previous_Scores e Exam_Score
    X = df.drop(['Exam_Score', 'Previous_Scores'], axis=1)
    y = df['Exam_Score']
    
    print(f"\n⚠️ Campos removidos: 'Exam_Score' (target), 'Previous_Scores' (viés)")
    print(f"   Features restantes: {list(X.columns)}")
    
    # Definir features numéricas e categóricas
    numeric_features = [
        'Hours_Studied',
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
        'Distance_from_Home'
    ]
    
    print(f"\n📊 Features numéricas: {len(numeric_features)}")
    print(f"📊 Features categóricas: {len(categorical_features)}")
    
    # Criar pipelines
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Criar ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ],
        remainder='drop'
    )
    
    # Treinar o pré-processador
    print("\n🔄 Treinando o pré-processador...")
    preprocessor.fit(X)
    print("✅ Pré-processador treinado com sucesso")
    
    # Salvar o pré-processador
    print(f"\n💾 Salvando pré-processador em: {PREPROCESSOR_PATH}")
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    print("✅ Pré-processador salvo com sucesso")
    
    # Testar o pré-processador
    print("\n🧪 Testando o pré-processador...")
    X_sample = X.head(5)
    X_processed = preprocessor.transform(X_sample)
    print(f"✅ Teste bem-sucedido: {X_sample.shape[0]} amostras -> {X_processed.shape[1]} features processadas")
    
    print("\n" + "=" * 60)
    print("✅ PROCESSO CONCLUÍDO COM SUCESSO!")
    print("=" * 60)
    print("\n💡 Próximos passos:")
    print("   1. Retreine o modelo com: py models/train_performance_regression.py")
    print("   2. O modelo agora não usará Previous_Scores, evitando viés")

if __name__ == "__main__":
    main()

