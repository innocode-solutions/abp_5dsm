import joblib
import pandas as pd

class DropoutService:
    def __init__(self, preprocess_path, model_path, columns_path=None):
        # Carrega o pré-processador e o modelo treinado
        self.preprocessor = joblib.load(preprocess_path)
        self.model = joblib.load(model_path)

        # Se houver arquivo de colunas salvas, usa para alinhar as features
        if columns_path:
            self.columns = joblib.load(columns_path)
        else:
            # Caso não exista, tenta extrair automaticamente do pré-processador
            try:
                self.columns = self.preprocessor.feature_names_in_
            except AttributeError:
                self.columns = None

    def predict_dropout(self, student_data: dict):
        # Converte o dicionário em DataFrame
        X = pd.DataFrame([student_data])

        # Reorganiza colunas conforme o esperado pelo modelo
        if self.columns is not None:
            X = X.reindex(columns=self.columns, fill_value=0)

        # Aplica o pré-processamento
        X_processed = self.preprocessor.transform(X)

        # Calcula probabilidade de evasão
        proba = self.model.predict_proba(X_processed)[0, 1]

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

        return {
            "probability_dropout": float(proba),
            "class_dropout": dropout_class,
            "explain": explain
        }
