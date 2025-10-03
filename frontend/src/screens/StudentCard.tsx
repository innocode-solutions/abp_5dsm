import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Definindo a interface localmente
interface Student {
  nome: string;
  risco: string;
  media: number;
}

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  const riskLevel: "Baixo" | "Médio" | "Alto" =
    student.risco.includes("Baixo")
      ? "Baixo"
      : student.risco.includes("Médio")
      ? "Médio"
      : "Alto";

  const riskColor =
    riskLevel === "Baixo" ? "green" : riskLevel === "Médio" ? "orange" : "red";

  return (
    <View style={styles.card}>
      <View style={styles.infoGroup}>
        <View style={styles.avatar} />
        <View style={styles.infoColumn}>
          <Text style={styles.name}>{student.nome}</Text>
          <Text style={[styles.risk, { color: riskColor }]}>{student.risco}</Text>
          <Text style={styles.average}>Média: {student.media}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  infoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoColumn: {
    flexDirection: "column",
    gap: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1d5db",
  },
  name: {
    fontWeight: "600",
  },
  risk: {
    fontSize: 14,
  },
  average: {
    fontSize: 13,
    color: "#6b7280",
  },
});
