import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Section from '../components/Section';
import colors from '../theme/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface OverviewData {
  resumo: {
    totalCursos: number;
    totalDisciplinas: number;
    totalAlunos: number;
    totalMatriculas: number;
    totalPeriodos: number;
    evasaoMedia: string;
    desempenhoMedio: number;
  };
  cursosMaisPopulares: Array<{ id: string; curso: string; alunos: number }>;
  disciplinasMaisCursadas: Array<{ id: string; disciplina: string; matriculas: number }>;
  top3CursosRisco: Array<{ curso: string; evasao: number }>;
}

interface AggregatesData {
  agregadoGeral: {
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  };
  porCurso: Array<{
    idCurso: string;
    nomeCurso: string;
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  }>;
  porDisciplina: Array<{
    idDisciplina: string;
    nomeDisciplina: string;
    idCurso: string;
    nomeCurso: string;
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  }>;
}

export default function DashboardIESScreen() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [aggregates, setAggregates] = useState<AggregatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!token) return;

    try {
      const [overviewRes, aggregatesRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/ies/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_URL}/dashboard/ies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData);
      }

      if (aggregatesRes.ok) {
        const aggregatesData = await aggregatesRes.json();
        setAggregates(aggregatesData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Resumo Geral */}
        {overview?.resumo && (
          <Section title="Resumo Geral">
            <View style={styles.grid}>
              <Card>
                <Text style={styles.cardLabel}>Total de Cursos</Text>
                <Text style={styles.cardValue}>{overview.resumo.totalCursos}</Text>
              </Card>
              <Card>
                <Text style={styles.cardLabel}>Total de Disciplinas</Text>
                <Text style={styles.cardValue}>{overview.resumo.totalDisciplinas}</Text>
              </Card>
            </View>
            <View style={styles.grid}>
              <Card>
                <Text style={styles.cardLabel}>Total de Alunos</Text>
                <Text style={styles.cardValue}>{overview.resumo.totalAlunos}</Text>
              </Card>
              <Card>
                <Text style={styles.cardLabel}>Total de Matrículas</Text>
                <Text style={styles.cardValue}>{overview.resumo.totalMatriculas}</Text>
              </Card>
            </View>
            <Card style={{ marginTop: 12 }}>
              <Text style={styles.cardLabel}>Taxa Média de Evasão</Text>
              <Text style={styles.totalValue}>{overview.resumo.evasaoMedia}%</Text>
            </Card>
          </Section>
        )}

        {/* Agregados Gerais */}
        {aggregates?.agregadoGeral && (
          <Section title="Desempenho e Evasão - Geral">
            <View style={styles.grid}>
              <Card>
                <Text style={styles.cardLabel}>Média de Notas</Text>
                <Text style={styles.cardValue}>
                  {aggregates.agregadoGeral.mediaNota.toFixed(2)}
                </Text>
              </Card>
              <Card>
                <Text style={styles.cardLabel}>% Aprovação</Text>
                <Text style={styles.cardValue}>
                  {aggregates.agregadoGeral.percentualAprovacao.toFixed(1)}%
                </Text>
              </Card>
            </View>
            <Card style={{ marginTop: 12 }}>
              <Text style={styles.cardLabel}>% Risco de Evasão</Text>
              <Text style={styles.totalValue}>
                {aggregates.agregadoGeral.percentualEvasao.toFixed(1)}%
              </Text>
            </Card>
          </Section>
        )}

        {/* Por Curso */}
        {aggregates?.porCurso && aggregates.porCurso.length > 0 && (
          <Section title="Desempenho por Curso">
            {aggregates.porCurso.map((curso) => (
              <Card key={curso.idCurso} style={{ marginBottom: 8 }}>
                <Text style={styles.cursoTitle}>{curso.nomeCurso}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>
                    Média: {curso.mediaNota.toFixed(2)}
                  </Text>
                  <Text style={styles.metricText}>
                    Aprovação: {curso.percentualAprovacao.toFixed(1)}%
                  </Text>
                  <Text style={styles.metricText}>
                    Evasão: {curso.percentualEvasao.toFixed(1)}%
                  </Text>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {/* Por Disciplina */}
        {aggregates?.porDisciplina && aggregates.porDisciplina.length > 0 && (
          <Section title="Desempenho por Disciplina">
            {aggregates.porDisciplina.slice(0, 10).map((disc) => (
              <Card key={disc.idDisciplina} style={{ marginBottom: 8 }}>
                <Text style={styles.disciplinaTitle}>{disc.nomeDisciplina}</Text>
                <Text style={styles.cursoSubtitle}>{disc.nomeCurso}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>
                    Média: {disc.mediaNota.toFixed(2)}
                  </Text>
                  <Text style={styles.metricText}>
                    Aprovação: {disc.percentualAprovacao.toFixed(1)}%
                  </Text>
                  <Text style={styles.metricText}>
                    Evasão: {disc.percentualEvasao.toFixed(1)}%
                  </Text>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {/* Top 3 Cursos com Maior Risco */}
        {overview?.top3CursosRisco && overview.top3CursosRisco.length > 0 && (
          <Section title="Top 3 Cursos com Maior Risco de Evasão">
            {overview.top3CursosRisco.map((curso, index) => (
              <Card key={index} style={{ marginBottom: 8 }}>
                <Text style={styles.cursoTitle}>{curso.curso}</Text>
                <Text style={styles.riscoValue}>{curso.evasao.toFixed(1)}%</Text>
              </Card>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', gap: 12 },
  cardLabel: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  cardValue: { color: colors.text, fontSize: 20, fontWeight: '600' },
  totalValue: { color: colors.text, fontSize: 28, fontWeight: '700' },
  cursoTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  disciplinaTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cursoSubtitle: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  metricText: { color: colors.text, fontSize: 12 },
  riscoValue: { color: '#EF4444', fontSize: 24, fontWeight: '700', marginTop: 4 },
});

