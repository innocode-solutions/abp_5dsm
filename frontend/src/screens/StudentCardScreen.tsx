import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import StudentCard from "./StudentCard";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation";
type Props = NativeStackScreenProps<RootStackParamList, "StudentCard">;

// O componente agora recebe 'navigation' nas props
export default function StudentCardScreen({ navigation }: Props) {
  const { user } = useAuth();

  // Mock data - replace with actual API call
  const mockStudents = [
    { nome: "João Silva", risco: "Risco Baixo", media: 8.5 },
    { nome: "Maria Santos", risco: "Risco Médio", media: 6.2 },
    { nome: "Pedro Costa", risco: "Risco Alto", media: 4.1 },
  ];

  const goToHabits = () => {
    // Navega para a tela de hábitos. O nome 'Habits' deve ser o nome da rota.
    navigation.navigate("Habits");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Bem-vindo, {user?.name || "Usuário"}!
        </Text>
        <Text style={styles.subtitle}>Lista de Estudantes</Text>
      </View>

      {/* NOVO BOTÃO DE ACESSO AOS HÁBITOS */}
      <TouchableOpacity style={styles.button} onPress={goToHabits}>
        <Text style={styles.buttonText}>Acessar Meus Hábitos</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {mockStudents.map((student, index) => (
          <StudentCard key={index} student={student} />
        ))}
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
  // NOVOS ESTILOS PARA O BOTÃO
  button: {
    backgroundColor: "#4A90E2", // Cor de destaque
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});