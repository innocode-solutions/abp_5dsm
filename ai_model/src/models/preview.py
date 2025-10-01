import pandas as pd
import joblib
import shap

class PredictionService:
    """
    Uma classe de serviço OTIMIZADA que lida com todas as operações de Machine Learning.
    """
    def __init__(self, preprocessor_path, logreg_path, rf_path, data_path):
        print("Iniciando PredictionService...")
        self.preprocessor = None
        self.models = {}
        self.explainers = {}
        self.X_train_proc = None
        self.feature_names = None
        self._load_artifacts(preprocessor_path, logreg_path, rf_path, data_path)

    def _load_artifacts(self, preprocessor_path, logreg_path, rf_path, data_path):
        """
        Método privado para carregar e PRÉ-CALCULAR todos os artefatos necessários uma vez.
        """
        try:
            self.preprocessor = joblib.load(preprocessor_path)
            self.models = {
                'Regressão Logística': joblib.load(logreg_path),
                'Random Forest': joblib.load(rf_path)
            }
            df_train = pd.read_csv(data_path)
            X_train_ref = df_train.drop('Exam_Score', axis=1)
            
            print("Pré-processando dados de referência para o SHAP...")
            self.X_train_proc = self.preprocessor.transform(X_train_ref)
            self.feature_names = self.preprocessor.get_feature_names_out()
            
            print("Pré-calculando os explainers SHAP...")
            self.explainers = {
                name: shap.Explainer(model, self.X_train_proc)
                for name, model in self.models.items()
            }
            print("✅ Todos os artefatos foram carregados e pré-calculados com sucesso.")
        except FileNotFoundError as e:
            print(f"❌ ERRO CRÍTICO ao carregar artefatos: {e}")
            raise

    def generate_report(self, student_data: dict, top_n=3):
        """
        Gera um relatório completo para os dados de um aluno no formato de API especificado.
        """
        df_student = pd.DataFrame([student_data])
        processed_student_data = self.preprocessor.transform(df_student)
        
        # Vamos usar o modelo 'Random Forest' para a resposta final.
        model_name = 'Random Forest'
        model = self.models[model_name]
        
        # Previsão
        prediction_code = int(model.predict(processed_student_data)[0])
        probability = float(model.predict_proba(processed_student_data)[0][1]) # Probabilidade de ser classe 1 (APROVADO)
        
        # Explicação com SHAP
        explainer = self.explainers[model_name]
        shap_values = explainer(processed_student_data)
        
        try:
            shap_values_for_positive_class = shap_values.values[0, :, 1]
        except IndexError:
            shap_values_for_positive_class = shap_values.values[0]

        feature_impacts = pd.DataFrame(
            list(zip(self.feature_names, shap_values_for_positive_class)),
            columns=['feature', 'shap_value']
        ).sort_values(by='shap_value', key=abs, ascending=False).head(top_n)

        explanation_list = []
        for _, row in feature_impacts.iterrows():
            feature_part = row['feature'].split('__')[1]
            original_feature_name = next((col for col in student_data if feature_part.startswith(col)), feature_part)
            feature_value = student_data.get(original_feature_name, 'N/A')
            influence = "positiva" if row['shap_value'] > 0 else "negativa"
            explanation_list.append({"feature": original_feature_name, "value": feature_value, "influence": influence})
        
        # --- MUDANÇA PRINCIPAL: Monta o dicionário de resposta com as chaves corretas ---
        api_response = {
            "probability_pass": probability,
            "class_pass": "APROVADO" if prediction_code == 1 else "REPROVADO",
            "score_pred": probability,  # Usando a probabilidade como o score
            "explain": explanation_list
        }
        
        return api_response