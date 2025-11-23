#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script auxiliar para predição de desempenho
Executado via child_process do Node.js
"""

import sys
import json
import math
import joblib
import pandas as pd
import shap
from pathlib import Path

# Configuração de caminhos - agora relativo ao backend/src/ml
BASE_DIR = Path(__file__).resolve().parent.parent
PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"
LOGREG_PATH = BASE_DIR / "pipelines" / "perf_logreg_model.pkl"
RF_PATH = BASE_DIR / "pipelines" / "perf_rf_model.pkl"
REGRESSION_MODEL_PATH = BASE_DIR / "pipelines" / "perf_regression_model.pkl"
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
    
    # FORÇAR RECARREGAMENTO para garantir que estamos usando o preprocessor atualizado
    # Comentado temporariamente para debug
    # if _models_cache is not None:
    #     return _preprocessor_cache, _models_cache, _explainers_cache, _X_train_proc_cache, _feature_names_cache
    
    try:
        _preprocessor_cache = joblib.load(PREPROCESSOR_PATH)
        _models_cache = {
            'Regressão Logística': joblib.load(LOGREG_PATH),
            'Random Forest': joblib.load(RF_PATH)
        }
        
        df_train = pd.read_csv(DATA_PATH)
        print(f"🔍 DEBUG load_artifacts: Colunas no dataset: {list(df_train.columns)}", file=sys.stderr)
        print(f"🔍 DEBUG load_artifacts: Shape do dataset: {df_train.shape}", file=sys.stderr)
        
        # REMOVER Previous_Scores para corresponder ao preprocessor treinado
        X_train_ref = df_train.drop(['Exam_Score', 'Previous_Scores'], axis=1)
        print(f"🔍 DEBUG load_artifacts: Colunas após remover Exam_Score e Previous_Scores: {list(X_train_ref.columns)}", file=sys.stderr)
        print(f"🔍 DEBUG load_artifacts: Shape após remover: {X_train_ref.shape}", file=sys.stderr)
        
        # Verificar se o preprocessor tem feature_names_in_ e reordenar colunas
        if hasattr(_preprocessor_cache, 'feature_names_in_'):
            expected_features = list(_preprocessor_cache.feature_names_in_)
            print(f"🔍 DEBUG load_artifacts: Features esperadas pelo preprocessor: {expected_features}", file=sys.stderr)
            print(f"🔍 DEBUG load_artifacts: Número de features esperadas: {len(expected_features)}", file=sys.stderr)
            
            # Verificar se todas as features esperadas estão presentes
            missing_features = [f for f in expected_features if f not in X_train_ref.columns]
            if missing_features:
                print(f"⚠️ DEBUG load_artifacts: Features faltando: {missing_features}", file=sys.stderr)
            
            # Reordenar as colunas para corresponder à ordem esperada pelo preprocessor
            X_train_ref = X_train_ref[expected_features]
            print(f"✅ DEBUG load_artifacts: Colunas reordenadas para corresponder ao preprocessor", file=sys.stderr)
            print(f"🔍 DEBUG load_artifacts: Shape do X_train_ref antes da transformação: {X_train_ref.shape}", file=sys.stderr)
        
        try:
            _X_train_proc_cache = _preprocessor_cache.transform(X_train_ref)
            print(f"✅ DEBUG load_artifacts: Transformação bem-sucedida. Shape processado: {_X_train_proc_cache.shape}", file=sys.stderr)
        except Exception as e:
            print(f"❌ DEBUG load_artifacts: Erro na transformação: {str(e)}", file=sys.stderr)
            print(f"❌ DEBUG load_artifacts: Shape do X_train_ref: {X_train_ref.shape}", file=sys.stderr)
            print(f"❌ DEBUG load_artifacts: Colunas do X_train_ref: {list(X_train_ref.columns)}", file=sys.stderr)
            raise
        _feature_names_cache = _preprocessor_cache.get_feature_names_out()
        
        # Pré-calcula os explainers SHAP apenas para modelos compatíveis
        # Os modelos de classificação antigos podem ter sido treinados com preprocessor diferente
        _explainers_cache = {}
        for name, model in _models_cache.items():
            try:
                # Verificar se o modelo é compatível com o preprocessor atual
                # Tentando fazer uma predição de teste
                test_pred = model.predict(_X_train_proc_cache[:1])
                # Se funcionou, criar o explainer
                _explainers_cache[name] = shap.Explainer(model, _X_train_proc_cache)
                print(f"✅ DEBUG load_artifacts: Explainer criado para {name}", file=sys.stderr)
            except Exception as e:
                print(f"⚠️ DEBUG load_artifacts: Não foi possível criar explainer para {name}: {str(e)}", file=sys.stderr)
                print(f"⚠️ DEBUG load_artifacts: Modelo {name} pode ter sido treinado com preprocessor diferente", file=sys.stderr)
                # Continuar sem esse explainer - usaremos apenas o modelo de regressão para explicações
        
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
        # Log para debug
        print(f"🔍 DEBUG: Colunas no student_data: {list(df_student.columns)}", file=sys.stderr)
        print(f"🔍 DEBUG: Shape do df_student: {df_student.shape}", file=sys.stderr)
        
        # Garantir que as colunas estão na ordem correta esperada pelo preprocessor
        if hasattr(preprocessor, 'feature_names_in_'):
            expected_features = list(preprocessor.feature_names_in_)
            print(f"🔍 DEBUG: Features esperadas pelo preprocessor: {expected_features}", file=sys.stderr)
            print(f"🔍 DEBUG: Número de features esperadas: {len(expected_features)}", file=sys.stderr)
            
            # Reordenar as colunas para corresponder à ordem esperada pelo preprocessor
            missing_features = [f for f in expected_features if f not in df_student.columns]
            if missing_features:
                print(f"⚠️ DEBUG: Features faltando: {missing_features}", file=sys.stderr)
            
            # Garantir que todas as features esperadas estão presentes
            for feature in expected_features:
                if feature not in df_student.columns:
                    print(f"⚠️ DEBUG: Feature '{feature}' não encontrada, adicionando com valor padrão", file=sys.stderr)
                    # Adicionar valor padrão baseado no tipo
                    if feature in ['Hours_Studied', 'Sleep_Hours', 'Attendance']:
                        df_student[feature] = 0  # Valor padrão numérico
                    else:
                        df_student[feature] = 'Unknown'  # Valor padrão categórico
            
            # Reordenar colunas para corresponder à ordem esperada
            df_student = df_student[expected_features]
            print(f"🔍 DEBUG: Colunas após reordenação: {list(df_student.columns)}", file=sys.stderr)
        
        processed_student_data = preprocessor.transform(df_student)
        
        # Tenta usar o modelo de regressão primeiro (retorna nota real)
        # Se não existir, usa o modelo de classificação como fallback
        try:
            # PRIMEIRO: Extrair e verificar valores ANTES de fazer a predição
            # Previous_Scores removido para evitar viés - o modelo não deve usar notas anteriores
            hours_studied = float(student_data.get('Hours_Studied', 0) or 0)
            attendance = float(student_data.get('Attendance', 0) or 0)
            sleep_hours = float(student_data.get('Sleep_Hours', 0) or 0)
            
            # Log imediato dos valores recebidos
            print(f"🔍🔍🔍 VALORES RECEBIDOS (ANTES DA PREDIÇÃO):", file=sys.stderr)
            print(f"   Hours_Studied: {hours_studied}", file=sys.stderr)
            print(f"   Attendance: {attendance}", file=sys.stderr)
            print(f"   Sleep_Hours: {sleep_hours}", file=sys.stderr)
            print(f"   ⚠️ Previous_Scores removido para evitar viés", file=sys.stderr)
            
            # O modelo foi treinado com casos extremos (tudo negativo → 0, tudo positivo → 100)
            # Então ele deve aprender esses padrões. Não precisamos de lógica de correção no backend.
            regression_model = joblib.load(REGRESSION_MODEL_PATH)
            # Predição de regressão: retorna a nota real (0-100)
            predicted_score = float(regression_model.predict(processed_student_data)[0])
            print(f"🔍 Predição do modelo (sem correções): {predicted_score:.2f}", file=sys.stderr)
            
            # Apenas garantir que está no range válido (0-100)
            predicted_score = max(0.0, min(100.0, predicted_score))
            
            # LOG FINAL para debug
            print(f"✅ NOTA FINAL (modelo puro, sem correções): {predicted_score:.1f}", file=sys.stderr)
            
            # Calcular probabilidade de aprovação usando função sigmóide centrada em 60
            # Quanto mais longe de 60, maior a certeza (aprovação ou reprovação)
            # Quanto mais perto de 60, menor a certeza (zona de risco)
            # Função sigmóide: quanto mais longe de 60, mais próximo de 0 ou 1
            # Se nota = 60, probability = 0.5 (incerto)
            # Se nota = 70, probability ≈ 0.88 (alta confiança em aprovação)
            # Se nota = 50, probability ≈ 0.12 (alta confiança em reprovação)
            z = (predicted_score - 60) / 10  # Normaliza: cada 10 pontos = 1 unidade
            probability = 1 / (1 + math.exp(-z))  # Função sigmóide
            
            # Calcular confidence baseada na distância do limiar (60)
            # Confidence alta quando está longe de 60, média quando está perto
            distance_from_threshold = abs(predicted_score - 60)
            # Confidence máxima (0.95) quando está 20+ pontos longe, mínima (0.6) quando está em 60
            confidence = min(0.95, max(0.6, 0.6 + (distance_from_threshold / 20) * 0.35))
            
            prediction_code = 1 if predicted_score >= 60 else 0
            use_regression = True
        except (FileNotFoundError, Exception) as e:
            # Fallback para modelo de classificação
            use_regression = False
            model_name = 'Random Forest'
            model = models[model_name]
            prediction_code = int(model.predict(processed_student_data)[0])
            probability = float(model.predict_proba(processed_student_data)[0][1])
            # Mapear probabilidade para nota (método antigo melhorado)
            if probability < 0.3:
                predicted_score = float(probability / 0.3 * 40)
            elif probability < 0.7:
                predicted_score = float(40 + (probability - 0.3) / 0.4 * 30)
            else:
                predicted_score = float(70 + (probability - 0.7) / 0.3 * 30)
            predicted_score = max(0, min(100, predicted_score))
            # Para modelo de classificação, confidence = probability (confiança do modelo)
            confidence = float(probability)
        
        # Explicação com SHAP (usa Random Forest para explicação mesmo se regressão for usada)
        # Se o explainer do Random Forest não estiver disponível, usar o primeiro disponível
        explanation_list = []
        shap_values_for_positive_class = None
        
        if explainers:
            # Tentar usar Random Forest primeiro, senão usar o primeiro disponível
            explainer_model_name = 'Random Forest' if 'Random Forest' in explainers else list(explainers.keys())[0]
            explainer = explainers[explainer_model_name]
            
            try:
                shap_values = explainer(processed_student_data)
                
                try:
                    shap_values_for_positive_class = shap_values.values[0, :, 1]
                except IndexError:
                    shap_values_for_positive_class = shap_values.values[0]
            except Exception as e:
                print(f"⚠️ DEBUG: Erro ao calcular SHAP values: {str(e)}", file=sys.stderr)
                # Se não conseguir calcular SHAP, usar lista vazia de explicações
                shap_values_for_positive_class = None
        
            feature_impacts = pd.DataFrame(
                list(zip(feature_names, shap_values_for_positive_class)),
                columns=['feature', 'shap_value']
            ).sort_values(by='shap_value', key=abs, ascending=False).head(top_n)
            
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
        
        # predicted_score já foi calculado acima (do modelo de regressão ou mapeado do classificador)
        is_approved = predicted_score >= 60.0
        
        # Se não usou regressão, confidence = probability (do modelo de classificação)
        if not use_regression:
            confidence = float(probability)
        
        result = {
            "predicted_score": predicted_score,
            "confidence": float(confidence),
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
    # Verificar se há argumentos de linha de comando para modo de teste
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Modo de teste com dados de exemplo
        test_data = {
            "Hours_Studied": 5,
            "Sleep_Hours": 2,
            "Distance_from_Home": "Near",
            "Attendance": 20,
            "Gender": "Male",
            "Parental_Education_Level": "None",
            "Parental_Involvement": "Low",
            "School_Type": "Public",
            "Peer_Influence": "Positive",
            "Extracurricular_Activities": "Yes",
            "Learning_Disabilities": "Yes",
            "Internet_Access": "Yes",
            "Access_to_Resources": "Poor",
            "Teacher_Quality": "Poor",
            "Family_Income": "Low",
            "Motivation_Level": "Low",
            "Tutoring_Sessions": "Yes",
            "Physical_Activity": "Low"
        }
        print("🧪 Modo de teste ativado", file=sys.stderr)
        predict_performance(test_data)
    else:
        # Lê dados do stdin (modo normal quando chamado pelo Node.js)
        input_data = sys.stdin.read()
        
        if not input_data:
            error_result = {
                "error": "Nenhum dado recebido via stdin",
                "type": "ValueError"
            }
            print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)
        
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

