# =============================================================================
# ARQUIVO: 4_explicar_previsao_final.py
# OBJETIVO: Atender a User Story de explicabilidade, sendo compatível com
#           diferentes tipos de modelos (Regressão Logística e Árvores).
# =============================================================================

import pandas as pd
import joblib
import shap

# --- 1. CONFIGURAÇÕES E CARREGAMENTO DOS ARTEFATOS ---
PREPROCESSOR_PATH = '../pipelines/perf_preprocess.pkl'
DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'

# Carrega ambos os modelos para demonstrar a compatibilidade
MODEL_PATHS = {
    'Regressão Logística': '../pipelines/perf_logreg_model.pkl',
    'Random Forest': '../pipelines/perf_rf_model.pkl'  # Modelo de árvore para comparação
}

print("Iniciando sistema de previsão e explicação...")

try:
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    models = {name: joblib.load(path) for name, path in MODEL_PATHS.items()}
    df_train = pd.read_csv(DATASET_PATH)
    X_train = df_train.drop('Exam_Score', axis=1)
    print("✅ Artefatos (pré-processador e modelos) carregados com sucesso.")
except FileNotFoundError as e:
    print(f"❌ ERRO CRÍTICO: Não foi possível carregar os arquivos. {e}")
    print("➡️  Certifique-se de que os scripts 1 e 2 foram executados com sucesso.")
    exit()

# --- 2. IMPLEMENTAÇÃO DOS CRITÉRIOS DE ACEITE ---

def get_top_features(model, preprocessor, X_train_ref, input_data: dict, top_n=3):
    """
    Calcula e retorna as features mais importantes para uma única previsão.
    Atende aos Critérios de Aceite da task.

    Args:
        model: O modelo treinado (logístico ou de árvore).
        preprocessor: O pipeline de pré-processamento.
        X_train_ref: DataFrame de treino para referência do SHAP.
        input_data (dict): Dicionário com os dados do aluno.
        top_n (int): Número de principais features a retornar.

    Returns:
        list: Lista de dicionários contendo a explicação dos principais fatores.
    """
    df_input = pd.DataFrame([input_data])
    input_proc = preprocessor.transform(df_input)
    X_train_proc = preprocessor.transform(X_train_ref)
    
    explainer = shap.Explainer(model, X_train_proc)
    shap_values = explainer(input_proc)

    feature_names = preprocessor.get_feature_names_out()
    try:
        shap_values_for_positive_class = shap_values.values[0, :, 1]
    except IndexError:
        shap_values_for_positive_class = shap_values.values[0]
    
    feature_impacts = pd.DataFrame(
        list(zip(feature_names, shap_values_for_positive_class)),
        columns=['feature', 'shap_value']
    ).sort_values(by='shap_value', key=abs, ascending=False).head(top_n)
    
    explanation = []
    for _, row in feature_impacts.iterrows():
        feature_part = row['feature'].split('__')[1]
        original_feature_name = next((col for col in input_data if feature_part.startswith(col)), feature_part)
        feature_value = input_data.get(original_feature_name, 'N/A')
        influence = "positiva (aumenta a chance de aprovação)" if row['shap_value'] > 0 else "negativa (aumenta a chance de reprovação)"
        explanation.append({
            "feature": original_feature_name,
            "value": feature_value,
            "influence": influence
        })
        
    return explanation

def get_prediction(model, preprocessor, input_data: dict):
    """
    Faz a previsão para um único aluno.
    """
    df_input = pd.DataFrame([input_data])
    input_proc = preprocessor.transform(df_input)
    
    prediction_code = int(model.predict(input_proc)[0])
    probability = float(model.predict_proba(input_proc)[0][1])
    prediction_label = "APROVADO" if prediction_code == 1 else "REPROVADO"
    
    return prediction_label, probability

# --- 3. EXECUÇÃO PRINCIPAL ---
if __name__ == '__main__':
    
    # Simule um novo aluno aqui
    novo_aluno = {
        'Hours_Studied': 2,
        'Previous_Scores': 50,
        'Sleep_Hours': 5,
        'Distance_from_Home': 'Near',
        'Attendance': 60,
        'Gender': 'Male',
        'Parental_Education_Level': "High School",
        'Parental_Involvement': 'Low',
        'School_Type': 'Public',
        'Peer_Influence': 'Negative',
        'Extracurricular_Activities': 'No',
        'Learning_Disabilities': 'No',
        'Internet_Access': 'No',
        'Access_to_Resources': 'Poor',
        'Teacher_Quality': 'Average',
        'Family_Income': 'Low',
        'Motivation_Level': 'Low',
        'Tutoring_Sessions': 'Yes',
        'Physical_Activity': 'Low'
    }

    # Itera sobre os modelos carregados para mostrar a compatibilidade
    for model_name, model_obj in models.items():
        # Gera o relatório completo para o modelo atual
        status_final, prob_final = get_prediction(model_obj, preprocessor, novo_aluno)
        # Chama a função que atende ao critério de aceite
        fatores = get_top_features(model_obj, preprocessor, X_train, novo_aluno, top_n=3)
        
        print("\n" + "="*80)
        print(f"--- RELATÓRIO DE PREVISÃO (MODELO: {model_name.upper()}) ---")
        print("="*80)
        print(f"\n1. RESULTADO DA ANÁLISE DO MODELO:")
        print(f"   - Status Previsto: {status_final}")
        print(f"   - Probabilidade de Aprovação: {prob_final:.2%}")
        print(f"\n2. PRINCIPAIS FATORES QUE INFLUENCIARAM ESTA DECISÃO:")
        for factor in fatores:
            print(f"   - Fator: {factor['feature']} (Valor: {factor['value']})")
            print(f"     ↳ Influência: {factor['influence']}")
        print("\n" + "="*80)