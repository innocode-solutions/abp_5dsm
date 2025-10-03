import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Section from "../components/Section";
import colors from "../theme/colors";

type Distribuicao = {
  label: string;
  value: number;
};

const MOCK = {
  className: "Turma Aprendizagem de Maquina",
  metrics: {
    mediaTurma: 7.8,
    alunosRisco: 4,
    alunosAprovados: 18,
  },
  distribuicaoNotas: [
    { label: "A", value: 10 },
    { label: "B", value: 12 },
    { label: "C", value: 8 },
    { label: "D", value: 6 },
    { label: "E", value: 7 },
    { label: "F", value: 5 },
  ] as Distribuicao[],
  pontosFortes: ["Resolucao de Problemas", "Trabalho em Equipe"],
  pontosFracos: ["Comunicacao", "Pensamento Critico"],
};

export default function ClassPerformance() {
  const ListHeader = useMemo(() => (
    <View style={{ gap: 20 }}>
      <Text style={styles.classTitle}>{MOCK.className}</Text>

      <Section title="Desempenho Consolidado">
        <View style={styles.metricsRow}>
          <Card style={styles.metricBox}>
            <Text style={styles.cardLabel}>Média Geral</Text>
            <Text style={styles.cardValue}>{MOCK.metrics.mediaTurma}</Text>
          </Card>
          <Card style={styles.metricBox}>
            <Text style={styles.cardLabel}>Alunos em Risco</Text>
            <Text style={styles.cardValue}>{MOCK.metrics.alunosRisco}%</Text>
          </Card>
        </View>
        <Card style={styles.metricBox}>
          <Text style={styles.cardLabel}>Alunos Aprovados</Text>
          <Text style={styles.cardValue}>{MOCK.metrics.alunosAprovados}%</Text>
        </Card>
      </Section>

      <Section title="Distribuição de Notas" />
    </View>
  ), []);

  const renderDistribuicao = ({ item, index }: ListRenderItemInfo<Distribuicao>) => {
    const isFirst = index === 0;
    const isLast = index === MOCK.distribuicaoNotas.length - 1;

    return (
      <View style={[
        styles.rowContainer,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast
      ]}>
        <Text>{item.label}: {item.value}</Text>
        {!isLast && <View style={styles.innerSeparator} />}
      </View>
    );
  };

  const renderPontos = (pontos: string[], title: string) => (
    <Section title={title}>
      {pontos.map((p, index) => (
        <View key={index} style={styles.rowContainer}>
          <Text>{title === "Pontos Fortes" ? "✓" : "✕"} {p}</Text>
        </View>
      ))}
    </Section>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={MOCK.distribuicaoNotas}
        keyExtractor={(item) => item.label}
        renderItem={renderDistribuicao}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            {renderPontos(MOCK.pontosFortes, "Pontos Fortes")}
            {renderPontos(MOCK.pontosFracos, "Pontos Fracos")}
          </View>
        }
        contentContainerStyle={styles.container}
        initialNumToRender={6}
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
  classTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
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
  innerSeparator: {
    height: 10,
    backgroundColor: "transparent",
  },
});
