#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script auxiliar para predição de desempenho
Executado via child_process do Node.js
"""

import sys
import json
import joblib
import pandas as pd
import shap
from pathlib import Path

# Configuração de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"
LOGREG_PATH = BASE_DIR / "pipelines" / "perf_logreg_model.pkl"
RF_PATH = BASE_DIR / "pipelines" / "perf_rf_model.pkl"
DATA_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"

# Cache global para modelos e explainers
_models_cache = None
_preprocessor_cache = None
_explainers_cache = None
_X_train_proc_cache = None
_feature_names_cache = None

def load_artifacts():
    """Carrega modelos e explainers (com cache)"""
    global _models_cache, _preprocessor_cache, _explainers_cache
    global _X_train_proc_cache, _feature_names_cache
    
    if _models_cache is not None:
        return _preprocessor_cache, _models_cache, _explainers_cache, _X_train_proc_cache, _feature_names_cache
    
    try:
        _preprocessor_cache = joblib.load(PREPROCESSOR_PATH)
        _models_cache = {
            'Regressão Logística': joblib.load(LOGREG_PATH),
            'Random Forest': joblib.load(RF_PATH)
        }
        
        df_train = pd.read_csv(DATA_PATH)
        X_train_ref = df_train.drop('Exam_Score', axis=1)
        
        _X_train_proc_cache = _preprocessor_cache.transform(X_train_ref)
        _feature_names_cache = _preprocessor_cache.get_feature_names_out()
        
        # Pré-calcula os explainers SHAP
        _explainers_cache = {
            name: shap.Explainer(model, _X_train_proc_cache)
            for name, model in _models_cache.items()
        }
        
    except Exception as e:
        raise Exception(f"Erro ao carregar artefatos: {str(e)}")
    
    return _preprocessor_cache, _models_cache, _explainers_cache, _X_train_proc_cache, _feature_names_cache

def _get_grade_category(score: float) -> str:
    """Categoriza a nota em faixas de desempenho"""
    if score >= 90:
        return "EXCELENTE"
    elif score >= 80:
        return "MUITO BOM"
    elif score >= 70:
        return "BOM"
    elif score >= 60:
        return "REGULAR"
    else:
        return "INSUFICIENTE"

def predict_performance(student_data: dict, top_n=3):
    """Prediz desempenho acadêmico"""
    try:
        preprocessor, models, explainers, X_train_proc, feature_names = load_artifacts()
        
        df_student = pd.DataFrame([student_data])
        processed_student_data = preprocessor.transform(df_student)
        
        # Usa o modelo 'Random Forest' para a resposta final
        model_name = 'Random Forest'
        model = models[model_name]
        
        # Previsão
        prediction_code = int(model.predict(processed_student_data)[0])
        probability = float(model.predict_proba(processed_student_data)[0][1])
        
        # Explicação com SHAP
        explainer = explainers[model_name]
        shap_values = explainer(processed_student_data)
        
        try:
            shap_values_for_positive_class = shap_values.values[0, :, 1]
        except IndexError:
            shap_values_for_positive_class = shap_values.values[0]
        
        feature_impacts = pd.DataFrame(
            list(zip(feature_names, shap_values_for_positive_class)),
            columns=['feature', 'shap_value']
        ).sort_values(by='shap_value', key=abs, ascending=False).head(top_n)
        
        explanation_list = []
        for _, row in feature_impacts.iterrows():
            feature_part = row['feature'].split('__')[1] if '__' in row['feature'] else row['feature']
            original_feature_name = next((col for col in student_data if feature_part.startswith(col)), feature_part)
            feature_value = student_data.get(original_feature_name, 'N/A')
            influence = "positiva" if row['shap_value'] > 0 else "negativa"
            explanation_list.append({
                "feature": original_feature_name,
                "value": feature_value,
                "influence": influence
            })
        
        predicted_score = float(probability * 100)
        is_approved = predicted_score >= 60.0
        
        result = {
            "predicted_score": predicted_score,
            "confidence": float(probability),
            "is_approved": is_approved,
            "approval_status": "APROVADO" if is_approved else "REPROVADO",
            "grade_category": _get_grade_category(predicted_score),
            "factors": explanation_list,
            "saved": False
        }
        
        # Imprime apenas o JSON para stdout
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
        predict_performance(student_data)
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

