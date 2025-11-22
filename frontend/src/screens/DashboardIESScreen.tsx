import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Section from '../components/Section';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getIESOverview, getIESAggregates } from '../service/dashboardService';

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
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [aggregates, setAggregates] = useState<AggregatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para determinar a cor baseada no percentual de evasão
  const getEvasaoColor = (percentual: number): string => {
    if (percentual < 25) {
      return colors.success; // Verde: abaixo de 25%
    } else if (percentual <= 60) {
      return colors.warning; // Amarelo: entre 25% e 60%
    } else {
      return colors.error; // Vermelho: acima de 60%
    }
  };

  const fetchData = async () => {
    if (!user || user.Role !== 'ADMIN') {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // Usar os serviços que já configuram o token automaticamente
      const [overviewData, aggregatesData] = await Promise.all([
        getIESOverview(),
        getIESAggregates(),
      ]);

      setOverview(overviewData);
      setAggregates(aggregatesData);
    } catch (error: any) {
      console.error('Erro ao buscar dados da IES:', error);
      setError(error.message || 'Erro ao carregar dados');
      // Em caso de erro, definir valores vazios para não quebrar a UI
      setOverview(null);
      setAggregates(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.Role === 'ADMIN') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>Puxe para baixo para tentar novamente</Text>
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
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Feather name="book" size={20} color="#1E88E5" />
                  </View>
                  <Text style={styles.cardLabel}>Total de Cursos</Text>
                </View>
                <Text style={styles.cardValue}>{overview.resumo.totalCursos}</Text>
              </Card>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                    <Feather name="file-text" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.cardLabel}>Total de Disciplinas</Text>
                </View>
                <Text style={styles.cardValue}>{overview.resumo.totalDisciplinas}</Text>
              </Card>
            </View>
            <View style={styles.grid}>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Feather name="users" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.cardLabel}>Total de Alunos</Text>
                </View>
                <Text style={styles.cardValue}>{overview.resumo.totalAlunos}</Text>
              </Card>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                    <Feather name="clipboard" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.cardLabel}>Total de Matrículas</Text>
                </View>
                <Text style={styles.cardValue}>{overview.resumo.totalMatriculas}</Text>
              </Card>
            </View>
          </Section>
        )}

        {/* Agregados Gerais */}
        {aggregates?.agregadoGeral && (
          <Section title="Desempenho e Evasão - Geral">
            <View style={styles.grid}>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Feather name="trending-up" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.cardLabel}>Média de Notas</Text>
                </View>
                <Text style={[styles.cardValue, { color: colors.success }]}>
                  {aggregates.agregadoGeral.mediaNota.toFixed(2)}
                </Text>
              </Card>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Feather name="check-circle" size={20} color="#1E88E5" />
                  </View>
                  <Text style={styles.cardLabel}>% Aprovação</Text>
                </View>
                <Text style={[styles.cardValue, { color: colors.primary }]}>
                  {aggregates.agregadoGeral.percentualAprovacao.toFixed(1)}%
                </Text>
              </Card>
            </View>
            <Card style={StyleSheet.flatten([styles.highlightCard, { marginTop: 16 }])}>
              <View style={styles.statHeader}>
                {(() => {
                  const evasaoColor = getEvasaoColor(aggregates.agregadoGeral.percentualEvasao);
                  const backgroundColor = evasaoColor === colors.success ? '#E8F5E9' : 
                                         evasaoColor === colors.warning ? '#FFF3E0' : '#FFEBEE';
                  const iconColor = evasaoColor === colors.success ? colors.success : 
                                   evasaoColor === colors.warning ? colors.warning : colors.error;
                  return (
                    <>
                      <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor }])}>
                        <Feather 
                          name={evasaoColor === colors.success ? "check-circle" : 
                               evasaoColor === colors.warning ? "alert-circle" : "alert-triangle"} 
                          size={24} 
                          color={iconColor} 
                        />
                      </View>
                      <View style={styles.highlightContent}>
                        <Text style={styles.cardLabel}>% Risco de Evasão</Text>
                        <Text style={StyleSheet.flatten([styles.highlightValue, { color: evasaoColor }])}>
                          {aggregates.agregadoGeral.percentualEvasao.toFixed(1)}%
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            </Card>
          </Section>
        )}

        {/* Por Curso */}
        {aggregates?.porCurso && aggregates.porCurso.length > 0 && (
          <Section title="Desempenho por Curso">
            {aggregates.porCurso.map((curso) => (
              <Card key={curso.idCurso} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Feather name="book-open" size={20} color={colors.primary} />
                  <Text style={styles.cursoTitle}>{curso.nomeCurso}</Text>
                </View>
                <View style={styles.metricsContainer}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Média</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>
                      {curso.mediaNota.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Aprovação</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {curso.percentualAprovacao.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Evasão</Text>
                    <Text style={[styles.metricValue, { color: colors.error }]}>
                      {curso.percentualEvasao.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {/* Por Disciplina */}
        {aggregates?.porDisciplina && aggregates.porDisciplina.length > 0 && (
          <Section title="Desempenho por Disciplina">
            {aggregates.porDisciplina.slice(0, 10).map((disc) => (
              <Card key={disc.idDisciplina} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Feather name="file-text" size={18} color={colors.primary} />
                  <View style={styles.detailTitleContainer}>
                    <Text style={styles.disciplinaTitle}>{disc.nomeDisciplina}</Text>
                    <Text style={styles.cursoSubtitle}>{disc.nomeCurso}</Text>
                  </View>
                </View>
                <View style={styles.metricsContainer}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Média</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>
                      {disc.mediaNota.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Aprovação</Text>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {disc.percentualAprovacao.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Evasão</Text>
                    <Text style={[styles.metricValue, { color: colors.error }]}>
                      {disc.percentualEvasao.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {/* Top 3 Cursos com Maior Risco */}
        {overview?.top3CursosRisco && overview.top3CursosRisco.length > 0 && (
          <Section title="Top 3 Cursos com Maior Risco de Evasão">
            {overview.top3CursosRisco.map((curso, index) => {
              const riscoColor = getEvasaoColor(curso.evasao);
              return (
                <Card key={index} style={StyleSheet.flatten([styles.riscoCard, { borderLeftColor: riscoColor }])}>
                  <View style={styles.riscoHeader}>
                    <View style={StyleSheet.flatten([styles.riscoBadge, { backgroundColor: riscoColor + '20' }])}>
                      <Text style={StyleSheet.flatten([styles.riscoBadgeText, { color: riscoColor }])}>
                        #{index + 1}
                      </Text>
                    </View>
                    <Text style={styles.cursoTitle}>{curso.curso}</Text>
                  </View>
                  <View style={styles.riscoValueContainer}>
                    <Feather 
                      name={riscoColor === colors.success ? "trending-up" : 
                           riscoColor === colors.warning ? "trending-down" : "alert-triangle"} 
                      size={20} 
                      color={riscoColor} 
                    />
                    <Text style={StyleSheet.flatten([styles.riscoValue, { color: riscoColor }])}>
                      {curso.evasao.toFixed(1)}%
                    </Text>
                  </View>
                </Card>
              );
            })}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  container: { 
    padding: 20, 
    paddingBottom: 40 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  loadingText: { 
    marginTop: 12, 
    color: colors.muted, 
    fontSize: 14 
  },
  errorText: { 
    color: '#DC2626', 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  errorSubtext: { 
    color: colors.muted, 
    fontSize: 14, 
    textAlign: 'center' 
  },
  grid: { 
    flexDirection: 'row', 
    gap: 16,
    marginBottom: 16
  },
  statCard: {
    padding: 20,
    minHeight: 120,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: { 
    color: colors.muted, 
    fontSize: 13, 
    fontWeight: '500',
    flex: 1,
  },
  cardValue: { 
    color: colors.text, 
    fontSize: 28, 
    fontWeight: '700',
    marginTop: 4,
  },
  highlightCard: {
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  highlightContent: {
    flex: 1,
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  detailCard: {
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailTitleContainer: {
    flex: 1,
  },
  cursoTitle: { 
    color: colors.text, 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 4,
  },
  disciplinaTitle: { 
    color: colors.text, 
    fontSize: 15, 
    fontWeight: '600',
    marginBottom: 4,
  },
  cursoSubtitle: { 
    color: colors.muted, 
    fontSize: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  riscoCard: {
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  riscoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  riscoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riscoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  riscoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riscoValue: { 
    fontSize: 28, 
    fontWeight: '700',
  },
});

