#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script auxiliar para predição de evasão
Executado via child_process do Node.js
"""

import sys
import json
import joblib
import pandas as pd
from pathlib import Path

# Configuração de caminhos - agora relativo ao backend/src/ml
BASE_DIR = Path(__file__).resolve().parent.parent
DROP_PREPROCESS = BASE_DIR / "pipelines" / "dropout_preprocess.pkl"
DROP_MODEL = BASE_DIR / "pipelines" / "dropout_logreg_model.pkl"

def predict_dropout(student_data: dict):
    """Prediz risco de evasão"""
    try:
        # Carrega o pré-processador e o modelo
        preprocessor = joblib.load(DROP_PREPROCESS)
        model = joblib.load(DROP_MODEL)
        
        # Converte o dicionário em DataFrame
        X = pd.DataFrame([student_data])
        
        # Reorganiza colunas conforme o esperado pelo modelo
        try:
            columns = preprocessor.feature_names_in_
            X = X.reindex(columns=columns, fill_value=0)
        except AttributeError:
            pass
        
        # Aplica o pré-processamento
        X_processed = preprocessor.transform(X)
        
        # Calcula probabilidade de evasão
        proba = model.predict_proba(X_processed)[0, 1]
        
        # Define a classificação com base no limiar
        if proba < 0.33:
            dropout_class = "baixo"
        elif proba < 0.66:
            dropout_class = "médio"
        else:
            dropout_class = "alto"
        
        explain = (
            f"Probabilidade de evasão classificada como {dropout_class} "
            f"com base nos dados fornecidos."
        )
        
        result = {
            "probability_dropout": float(proba),
            "class_dropout": dropout_class,
            "explain": explain
        }
        
        # Imprime apenas o JSON para stdout (será capturado pelo Node.js)
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # Lê dados do stdin
    input_data = sys.stdin.read()
    
    try:
        student_data = json.loads(input_data)
        predict_dropout(student_data)
    except json.JSONDecodeError as e:
        error_result = {
            "error": f"Erro ao parsear JSON: {str(e)}",
            "type": "JSONDecodeError"
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


