import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Section from "../components/Section";
import colors from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { getProfessorDashboard } from "../service/dashboardService";

type Distribuicao = {
  label: string;
  value: number;
};

export default function ClassPerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    className: string;
    metrics: {
      mediaTurma: number;
      alunosRisco: number;
      alunosAprovados: number;
    };
    distribuicaoNotas: Distribuicao[];
    pontosFortes: string[];
    pontosFracos: string[];
  } | null>(null);

  useEffect(() => {
    if (user?.IDUser && (user.Role === 'TEACHER' || user.Role === 'ADMIN')) {
      loadClassData();
    }
  }, [user]);

  const loadClassData = async () => {
    if (!user?.IDUser) return;
    
    try {
      setLoading(true);
      const dashboard = await getProfessorDashboard(user.IDUser);
      
      // Calcular métricas
      const metricas = dashboard.metricas;
      const mediaTurma = metricas.mediaNotas || 0;
      const alunosRisco = metricas.percentualRiscoAltoEvasao || 0;
      const alunosAprovados = metricas.percentualAprovados || 0;
      
      // Calcular distribuição de notas (simplificada)
      const distribuicaoNotas: Distribuicao[] = [
        { label: "A (9-10)", value: Math.round((alunosAprovados * 0.3) || 0) },
        { label: "B (7-8.9)", value: Math.round((alunosAprovados * 0.4) || 0) },
        { label: "C (5-6.9)", value: Math.round((alunosAprovados * 0.2) || 0) },
        { label: "D (3-4.9)", value: Math.round((100 - alunosAprovados) * 0.3 || 0) },
        { label: "E (1-2.9)", value: Math.round((100 - alunosAprovados) * 0.5 || 0) },
        { label: "F (0)", value: Math.round((100 - alunosAprovados) * 0.2 || 0) },
      ];
      
      // Pontos fortes e fracos baseados nas métricas
      const pontosFortes: string[] = [];
      const pontosFracos: string[] = [];
      
      if (alunosAprovados >= 70) {
        pontosFortes.push("Alta taxa de aprovação");
      } else {
        pontosFracos.push("Taxa de aprovação abaixo do ideal");
      }
      
      if (alunosRisco < 20) {
        pontosFortes.push("Baixo risco de evasão");
      } else {
        pontosFracos.push("Alto risco de evasão detectado");
      }
      
      if (mediaTurma >= 7) {
        pontosFortes.push("Boa média geral");
      } else {
        pontosFracos.push("Média geral abaixo do esperado");
      }
      
      setDashboardData({
        className: dashboard.disciplinas.length > 0 
          ? `Turma ${dashboard.disciplinas[0].NomeDaDisciplina}`
          : "Turma Geral",
        metrics: {
          mediaTurma,
          alunosRisco,
          alunosAprovados,
        },
        distribuicaoNotas,
        pontosFortes: pontosFortes.length > 0 ? pontosFortes : ["Aguardando dados"],
        pontosFracos: pontosFracos.length > 0 ? pontosFracos : ["Aguardando dados"],
      });
    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
      setDashboardData({
        className: "Turma",
        metrics: { mediaTurma: 0, alunosRisco: 0, alunosAprovados: 0 },
        distribuicaoNotas: [],
        pontosFortes: [],
        pontosFracos: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const ListHeader = useMemo(() => (
    <View style={{ gap: 20 }}>
      <Text style={styles.classTitle}>{dashboardData?.className || "Carregando..."}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : (
        <>
          <Section title="Desempenho Consolidado">
            <View style={styles.metricsRow}>
              <Card style={styles.metricBox}>
                <Text style={styles.cardLabel}>Média Geral</Text>
                <Text style={styles.cardValue}>{dashboardData?.metrics.mediaTurma.toFixed(1) || '0.0'}</Text>
              </Card>
              <Card style={styles.metricBox}>
                <Text style={styles.cardLabel}>Alunos em Risco</Text>
                <Text style={styles.cardValue}>{dashboardData?.metrics.alunosRisco.toFixed(1) || '0.0'}%</Text>
              </Card>
            </View>
            <Card style={styles.metricBox}>
              <Text style={styles.cardLabel}>Alunos Aprovados</Text>
              <Text style={styles.cardValue}>{dashboardData?.metrics.alunosAprovados.toFixed(1) || '0.0'}%</Text>
            </Card>
          </Section>

          <Section title="Distribuição de Notas" />
        </>
      )}
    </View>
  ), [dashboardData, loading]);

  const renderDistribuicao = ({ item, index }: ListRenderItemInfo<Distribuicao>) => {
    const distribuicao = dashboardData?.distribuicaoNotas || [];
    const isFirst = index === 0;
    const isLast = index === distribuicao.length - 1;

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
      {pontos.length > 0 ? (
        pontos.map((p, index) => (
          <View key={index} style={styles.rowContainer}>
            <Text>{title === "Pontos Fortes" ? "✓" : "✕"} {p}</Text>
          </View>
        ))
      ) : (
        <View style={styles.rowContainer}>
          <Text style={styles.emptyText}>Nenhum dado disponível</Text>
        </View>
      )}
    </Section>
  );

  const distribuicaoNotas = dashboardData?.distribuicaoNotas || [];

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={distribuicaoNotas}
        keyExtractor={(item) => item.label}
        renderItem={renderDistribuicao}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          !loading && dashboardData ? (
            <View style={{ gap: 12 }}>
              {renderPontos(dashboardData.pontosFortes, "Pontos Fortes")}
              {renderPontos(dashboardData.pontosFracos, "Pontos Fracos")}
            </View>
          ) : null
        }
        contentContainerStyle={styles.container}
        initialNumToRender={6}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum dado disponível</Text>
            </View>
          ) : null
        }
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontStyle: "italic",
  },
});
