// HabitScreen.tsx

import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";

// ⚠️ ATENÇÃO: Esta interface DEVE ser importada do seu HabitService.ts
// Foi incluída aqui temporariamente para fins de demonstração/correção.
export interface HabitData {
  sono: number;
  horasEstudo: number;
  motivacao: number;
  frequencia: number;
  IDHabito?: string;
  IDAluno?: string;
  createdAt?: string;
  updatedAt?: string; // Incluído para corrigir o erro 'updatedAt'
}

import { HabitService } from "../service/HabitService"; // Importe apenas o Service
import { useHabit } from "../context/HabitContext";
import { useAuth } from "../context/AuthContext";

const HabitScreen: React.FC = () => {
  const { submitHabits, loading } = useHabit();
  const { user } = useAuth();

  const [horasEstudo, setHorasEstudo] = useState("");
  const [horasSono, setHorasSono] = useState("");
  const [motivacao, setMotivacao] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  // 🚀 FUNÇÃO REVISADA: Tipada para retornar HabitData ou null
  const loadHabits = async (): Promise<HabitData | null> => {
    if (!user || !user.IDUser) return null;
    try {
      const data: HabitData = await HabitService.getHabits();

      // Preenche os states com os dados lidos do backend
      if (data && data.horasEstudo !== undefined) {
        setHorasEstudo(data.horasEstudo?.toString() || "");
        setHorasSono(data.sono?.toString() || "");
        setMotivacao(data.motivacao?.toString() || "");
        setFrequencia(data.frequencia?.toString() || "");
      }
      return data;
    } catch (err: any) {
      console.log("Erro ao carregar hábitos:", err.message || err);
      // Limpa os campos se houver erro (como 404 No Data)
      setHorasEstudo("");
      setHorasSono("");
      setMotivacao("");
      setFrequencia("");
      return null;
    }
  };

  // Chama a função ao carregar a tela (após o login)
  useEffect(() => {
    loadHabits().catch((err) =>
      console.log("Erro ao carregar hábitos (inicial):", err.message || err)
    );
  }, [user]);

  const validate = (): boolean => {
    // ... (Restante da validação) ...
    if (!horasEstudo || !horasSono || !motivacao || !frequencia) {
      setValidationError("Todos os campos são obrigatórios.");
      return false;
    }
    if (+horasEstudo < 0 || +horasEstudo > 12) {
      setValidationError("Horas de estudo devem estar entre 0 e 12.");
      return false;
    }
    if (+horasSono < 0 || +horasSono > 12) {
      setValidationError("Horas de sono devem estar entre 0 e 12.");
      return false;
    }
    if (+motivacao < 0 || +motivacao > 10) {
      setValidationError("Motivação deve estar entre 0 e 10.");
      return false;
    }
    if (+frequencia < 0 || +frequencia > 100) {
      setValidationError("Frequência deve estar entre 0 e 100%.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !user || !user.IDUser) return;

    try {
      await submitHabits({
        horasEstudo: Number(horasEstudo),
        sono: Number(horasSono),
        motivacao: Number(motivacao),
        frequencia: Number(frequencia),
      });

      setSuccessMessage("Hábitos salvos com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.log("Erro ao enviar hábitos:", err);
      Alert.alert("Erro", "Erro ao enviar hábitos.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hábitos de Estudo</Text>

        <Text style={styles.label}>Horas de Estudo Diárias (0-12):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={horasEstudo}
          onChangeText={setHorasEstudo}
          placeholder="Ex: 4"
        />

        <Text style={styles.label}>Horas de Sono (0-12):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={horasSono}
          onChangeText={setHorasSono}
          placeholder="Ex: 8"
        />

        <Text style={styles.label}>Nível de Motivação (0-10):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={motivacao}
          onChangeText={setMotivacao}
          placeholder="Ex: 9"
        />

        <Text style={styles.label}>Frequência às Aulas (%):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={frequencia}
          onChangeText={setFrequencia}
          placeholder="Ex: 90"
        />

        {validationError && (
          <Text style={styles.errorText}>{validationError}</Text>
        )}
        {successMessage && (
          <Text style={styles.successText}>{successMessage}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar Hábitos</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={async () => {
            try {
              const data = await loadHabits(); // data é HabitData ou null

              // ✅ CORREÇÃO: Checa se data existe E se updatedAt existe
              if (data && data.updatedAt) {
                const habitsString = `
                    Horas de Estudo: ${data.horasEstudo}
                    Horas de Sono: ${data.sono}
                    Motivação: ${data.motivacao}/10
                    Frequência: ${data.frequencia}%
                    Última atualização: ${new Date(
                      data.updatedAt
                    ).toLocaleDateString("pt-BR")}
                  `.trim();

                Alert.alert("Seus Hábitos Salvos", habitsString);
              } else {
                Alert.alert(
                  "Aviso",
                  "Nenhum hábito salvo encontrado para este usuário ou dados incompletos."
                );
              }
            } catch (err: any) {
              // 🚨 EXIBE O ERRO REAL AQUI
              Alert.alert(
                "Erro de Busca",
                `Não foi possível carregar hábitos. Detalhe: ${err.message}`
              );
              console.log("Erro completo do botão:", err);
            }
          }}
        >
          <Text style={styles.verifyButtonText}>Verificar Hábitos Salvos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HabitScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  successText: {
    color: "green",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  verifyButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 8,
  },
  verifyButtonText: {
    color: "#fff",
    textAlign: "center",
  },
});