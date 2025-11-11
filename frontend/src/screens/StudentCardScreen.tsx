import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import StudentCard from "./StudentCard";
import { useAuth } from "../context/AuthContext";

export default function StudentCardScreen() {
  const { user } = useAuth();

  // Mock data - replace with actual API call
  const mockStudents = [
    { nome: "João Silva", risco: "Risco Baixo", media: 8.5 },
    { nome: "Maria Santos", risco: "Risco Médio", media: 6.2 },
    { nome: "Pedro Costa", risco: "Risco Alto", media: 4.1 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo, {user?.name || "Usuário"}!</Text>
        <Text style={styles.subtitle}>Lista de Estudantes</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
});

