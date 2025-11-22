import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import StudentCard from "./StudentCard";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation";
import { apiConnection } from "../api/apiConnection";
import colors from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "StudentCard">;

interface Student {
  nome: string;
  risco: string;
  media: number;
}

// O componente agora recebe 'navigation' nas props
export default function StudentCardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Buscar alunos - se for aluno, buscar apenas seus próprios dados
      // Se for professor/admin, buscar todos os alunos
      if (user?.Role === 'STUDENT') {
        // Para aluno, não faz sentido mostrar lista de outros alunos
        // Esta tela provavelmente não deveria ser acessível para alunos
        setStudents([]);
      } else {
        // Para professor/admin, buscar lista de alunos
        const response = await apiConnection.get<{
          data: Array<{
            IDAluno: string;
            Nome: string;
            Email: string;
            curso?: { NomeDoCurso: string };
          }>;
        }>('/alunos?limit=50');
        
        // Converter para formato esperado
        // Nota: Esta tela parece ser uma tela de exemplo/deprecada
        // Para calcular risco e média reais, seria necessário buscar predições de cada aluno
        // Por enquanto, mostramos apenas os nomes
        const studentsList: Student[] = response.data.data.map(aluno => ({
          nome: aluno.Nome,
          risco: "Não calculado", // Seria necessário buscar predições individuais
          media: 0, // Seria necessário buscar predições individuais
        }));
        
        setStudents(studentsList);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const goToHabits = () => {
    // Navega para a tela de hábitos. O nome 'Habits' deve ser o nome da rota.
    navigation.navigate("Habits");
  };

  const goToEngagement = () => {
    // Navega para a tela de predição de evasão
    navigation.navigate("Engagement");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Bem-vindo, {user?.name || "Usuário"}!
        </Text>
        <Text style={styles.subtitle}>Lista de Estudantes</Text>
      </View>

      {/* BOTÕES DE ACESSO */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={goToHabits}>
          <Text style={styles.buttonText}>Acessar Meus Hábitos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={goToEngagement}>
          <Text style={styles.buttonText}>Predição de Evasão</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando alunos...</Text>
          </View>
        ) : students.length > 0 ? (
          students.map((student, index) => (
            <StudentCard key={index} student={student} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {user?.Role === 'STUDENT' 
                ? 'Esta tela não está disponível para alunos'
                : 'Nenhum aluno encontrado'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // ESTILOS PARA OS BOTÕES
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  button: {
    backgroundColor: "#4A90E2", // Cor de destaque
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonSecondary: {
    backgroundColor: "#1E88E5",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});