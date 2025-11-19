import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Section from "../components/Section";
import colors from "../theme/colors";

type Student = {
  id: number;
  nome: string;
  risco: string;
  media: number;
};

const MOCK = {
  overview: {
    mediaTurma: 7.8,
    riscoEvasao: "15%",
    totalAlunos: 32,
  },
  students: [
    { id: 1, nome: "Beatriz Silva", risco: "Baixo risco", media: 8.5 },
    { id: 2, nome: "Pedro Almeida", risco: "Médio risco", media: 6.2 },
    { id: 3, nome: "Carolina Santos", risco: "Baixo risco", media: 9.1 },
    { id: 4, nome: "Carlos Silva", risco: "Alto risco", media: 5.8 },
    { id: 5, nome: "Mariana Oliveira", risco: "Médio risco", media: 7.3 },
  ] as Student[],
};

export default function Dashboard({ navigation }: any) {
  const ListHeader = useMemo(() => (
    <View style={{ gap: 20 }}>
      <Text style={styles.title}>Visão Geral</Text>

      <Section title="Métricas da Turma">
        <View style={styles.metricsRow}>
          <TouchableOpacity style={styles.metricBox}>
            <Text style={styles.cardLabel}>Média da Turma</Text>
            <Text style={styles.cardValue}>{MOCK.overview.mediaTurma}</Text>
          </TouchableOpacity>
          <Card style={styles.metricBox}>
            <Text style={styles.cardLabel}>Risco de Evasão</Text>
            <Text style={styles.cardValue}>{MOCK.overview.riscoEvasao}</Text>
          </Card>
        </View>
        <Card style={styles.metricBox}>
          <Text style={styles.cardLabel}>Total de Alunos</Text>
          <Text style={styles.cardValue}>{MOCK.overview.totalAlunos}</Text>
        </Card>
      </Section>

      <Section title="Alunos" />
    </View>
  ), []);

  const renderItem = ({ item, index }: ListRenderItemInfo<Student>) => {
    const isFirst = index === 0;
    const isLast = index === MOCK.students.length - 1;

    return (
      <View style={[
        styles.rowContainer,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast
      ]}>
        <Text>{item.nome}</Text>
        <Text>{item.media}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={MOCK.students}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.container}
        initialNumToRender={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  cardValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
  },
  rowContainer: {
    backgroundColor: "#fff",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 4,
  },
});
