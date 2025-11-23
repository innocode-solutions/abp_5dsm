import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { getProfessorDashboard, ProfessorDashboard, AlunoDashboard } from '../service/dashboardService';
import { getTeacherClasses, Class } from '../service/classService';
import Card from '../components/Card';
import Section from '../components/Section';

type GradeDistribution = {
  label: string;
  value: number;
};

export default function TeacherReportsScreen() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ProfessorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ✅ Calcular selectedClass ANTES de usar em outras funções
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.IDDisciplina === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Carregar turmas
  const loadClasses = useCallback(async () => {
    if (!user?.IDUser) {
      setLoading(false);
      return;
    }

    try {
      const data = await getTeacherClasses(user.IDUser);
      setClasses(data);
      
      // Selecionar primeira turma automaticamente se houver
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].IDDisciplina);
      }
    } catch (err: any) {
      console.error('Erro ao carregar turmas:', err);
      setError(err.message || 'Erro ao carregar turmas');
    }
  }, [user?.IDUser, selectedClassId]);

  // Carregar dados do dashboard
  const loadDashboard = useCallback(async () => {
    if (!user?.IDUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const data = await getProfessorDashboard(
        user.IDUser,
        selectedClassId || undefined
      );
      setDashboard(data);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.IDUser, selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClassId || classes.length > 0) {
      loadDashboard();
    }
  }, [selectedClassId, loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Calcular distribuição de notas por categoria (A, B, C, D, E, F)
  const gradeDistribution: GradeDistribution[] = useMemo(() => {
    if (!dashboard?.alunos) return [];

    const distribution = {
      A: 0, // 90-100
      B: 0, // 80-89
      C: 0, // 70-79
      D: 0, // 60-69
      E: 0, // 50-59
      F: 0, // 0-49
    };

    dashboard.alunos.forEach((aluno) => {
      // Usar nota real se disponível, senão usar predição de desempenho
      let nota = aluno.nota;
      if (!nota && aluno.predicoes.desempenho) {
        // Converter probabilidade (0-1) para nota (0-100) e depois para escala 0-10
        nota = (aluno.predicoes.desempenho.probabilidade * 100) / 10;
      }

      if (nota !== null && nota !== undefined) {
        if (nota >= 9.0) distribution.A++;
        else if (nota >= 8.0) distribution.B++;
        else if (nota >= 7.0) distribution.C++;
        else if (nota >= 6.0) distribution.D++;
        else if (nota >= 5.0) distribution.E++;
        else distribution.F++;
      }
    });

    return [
      { label: 'A', value: distribution.A },
      { label: 'B', value: distribution.B },
      { label: 'C', value: distribution.C },
      { label: 'D', value: distribution.D },
      { label: 'E', value: distribution.E },
      { label: 'F', value: distribution.F },
    ];
  }, [dashboard]);

  // Calcular pontos fortes e fracos baseado nas predições
  const { pontosFortes, pontosFracos } = useMemo(() => {
    if (!dashboard?.alunos || dashboard.alunos.length === 0) {
      return {
        pontosFortes: ['Resolução de Problemas', 'Trabalho em Equipe'],
        pontosFracos: ['Comunicação', 'Pensamento Crítico'],
      };
    }

    // Análise simplificada baseada nas predições
    const alunosAprovados = dashboard.alunos.filter(
      (a) => a.nota !== null && a.nota >= 6.0
    ).length;
    const totalComNota = dashboard.alunos.filter(
      (a) => a.nota !== null
    ).length;
    const taxaAprovacao = totalComNota > 0 ? alunosAprovados / totalComNota : 0;

    const pontosFortes: string[] = [];
    const pontosFracos: string[] = [];

    if (taxaAprovacao >= 0.8) {
      pontosFortes.push('Alto índice de aprovação');
    }
    if (dashboard.metricas.mediaNotas >= 7.5) {
      pontosFortes.push('Boa média geral');
    }
    if (dashboard.metricas.percentualRiscoAltoEvasao < 20) {
      pontosFortes.push('Baixo risco de evasão');
    }

    if (taxaAprovacao < 0.6) {
      pontosFracos.push('Taxa de aprovação baixa');
    }
    if (dashboard.metricas.mediaNotas < 6.0) {
      pontosFracos.push('Média geral abaixo do esperado');
    }
    if (dashboard.metricas.percentualRiscoAltoEvasao > 30) {
      pontosFracos.push('Alto risco de evasão');
    }

    // Valores padrão se não houver análise suficiente
    if (pontosFortes.length === 0) {
      pontosFortes.push('Resolução de Problemas', 'Trabalho em Equipe');
    }
    if (pontosFracos.length === 0) {
      pontosFracos.push('Comunicação', 'Pensamento Crítico');
    }

    return { pontosFortes, pontosFracos };
  }, [dashboard]);

  // Função para escapar valores CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Se contém vírgula, aspas ou quebra de linha, envolver em aspas e escapar aspas
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // ✅ Função para gerar CSV - AGORA selectedClass já está definido
  const generateCSV = useCallback((): string => {
    if (!dashboard || !selectedClass) {
      return '';
    }

    const lines: string[] = [];
    
    // Cabeçalho do relatório
    lines.push('RELATÓRIO DE DESEMPENHO DA TURMA');
    lines.push(`Turma: ${selectedClass.NomeDaDisciplina}`);
    lines.push(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`);
    lines.push(''); // Linha em branco

    // Seção de Métricas
    lines.push('=== DESEMPENHO CONSOLIDADO ===');
    lines.push(`Média Geral,${dashboard.metricas.mediaNotas.toFixed(2)}`);
    lines.push(`Alunos Aprovados,${dashboard.metricas.percentualAprovados.toFixed(2)}%`);
    lines.push(`Alunos em Risco de Evasão,${dashboard.metricas.percentualRiscoAltoEvasao.toFixed(2)}%`);
    lines.push(`Total de Alunos,${dashboard.totalAlunos}`);
    lines.push(''); // Linha em branco

    // Distribuição de Notas
    lines.push('=== DISTRIBUIÇÃO DE NOTAS ===');
    lines.push('Categoria,Quantidade');
    gradeDistribution.forEach((dist) => {
      lines.push(`${dist.label},${dist.value}`);
    });
    lines.push(''); // Linha em branco

    // Dados dos Alunos
    lines.push('=== DADOS DOS ALUNOS ===');
    lines.push('Nome,Email,Semestre,Disciplina,Nota,Status,Risco de Evasão,Nota Prevista,Classificação Desempenho');
    
    dashboard.alunos.forEach((aluno) => {
      const nota = aluno.nota !== null ? aluno.nota.toFixed(2) : 'N/A';
      const notaPrevista = aluno.predicoes.desempenho
        ? (aluno.predicoes.desempenho.probabilidade * 100).toFixed(2)
        : 'N/A';
      const classificacaoDesempenho = aluno.predicoes.desempenho?.classificacao || 'N/A';
      const riscoEvasao = aluno.predicoes.evasao?.classificacao || 'N/A';

      lines.push(
        [
          escapeCSV(aluno.nome),
          escapeCSV(aluno.email),
          escapeCSV(aluno.semestre),
          escapeCSV(aluno.disciplina.nome),
          escapeCSV(nota),
          escapeCSV(aluno.status),
          escapeCSV(riscoEvasao),
          escapeCSV(notaPrevista),
          escapeCSV(classificacaoDesempenho),
        ].join(',')
      );
    });
    lines.push(''); // Linha em branco

    // Pontos Fortes e Fracos
    lines.push('=== PONTOS FORTES ===');
    pontosFortes.forEach((ponto) => {
      lines.push(escapeCSV(ponto));
    });
    lines.push(''); // Linha em branco

    lines.push('=== PONTOS FRACOS ===');
    pontosFracos.forEach((ponto) => {
      lines.push(escapeCSV(ponto));
    });

    return lines.join('\n');
  }, [dashboard, selectedClass, gradeDistribution, pontosFortes, pontosFracos]);

  // Função para exportar CSV
  const handleExport = useCallback(async () => {
    if (!dashboard || !selectedClass) {
      Alert.alert('Erro', 'Nenhum dado disponível para exportar.');
      return;
    }

    try {
      setExporting(true);

      const csvContent = generateCSV();
      
      if (!csvContent) {
        Alert.alert('Erro', 'Não foi possível gerar o conteúdo do CSV.');
        return;
      }
      
      // Nome do arquivo com data e nome da turma
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `relatorio_${selectedClass.NomeDaDisciplina.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;
      
      if (Platform.OS === 'web') {
        // Para web, usar download direto
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Sucesso', 'Relatório exportado com sucesso!');
      } else {
        // Para mobile, salvar e compartilhar
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Relatório CSV',
          });
        } else {
          Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
        }
      }
    } catch (err: any) {
      console.error('Erro ao exportar CSV');
      Alert.alert('Erro', `Erro ao exportar relatório: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }, [dashboard, selectedClass, generateCSV]);

  const renderGradeDistribution = ({ item, index }: { item: GradeDistribution; index: number }) => {
    const maxValue = Math.max(...gradeDistribution.map((g) => g.value), 1);
    const barHeight = (item.value / maxValue) * 100;

    return (
      <View key={item.label || index} style={styles.distributionItem}>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              {
                height: `${barHeight}%`,
                minHeight: item.value > 0 ? 20 : 0,
              },
            ]}
          />
        </View>
        <Text style={styles.distributionLabel}>{item.label}</Text>
        <Text style={styles.distributionValue}>{item.value}</Text>
      </View>
    );
  };

  const renderPontos = (pontos: string[], title: string) => (
    <Section title={title}>
      {pontos.map((p, index) => (
        <View key={index} style={styles.pontoRow}>
          <Feather
            name={title === 'Pontos Fortes' ? 'check-circle' : 'x-circle'}
            size={20}
            color={title === 'Pontos Fortes' ? '#16A34A' : '#DC2626'}
            style={styles.pontoIcon}
          />
          <Text style={styles.pontoText}>{p}</Text>
        </View>
      ))}
    </Section>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando relatórios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Filtro de Turma - Melhorado */}
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Feather name="filter" size={18} color={colors.text} />
            <Text style={styles.filterLabel}>Filtrar por Turma:</Text>
          </View>
          {classes.length > 0 ? (
            <FlatList
              horizontal
              data={classes}
              keyExtractor={(item) => item.IDDisciplina}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.classButton,
                    selectedClassId === item.IDDisciplina && styles.classButtonActive,
                  ]}
                  onPress={() => setSelectedClassId(item.IDDisciplina)}
                >
                  <Text
                    style={[
                      styles.classButtonText,
                      selectedClassId === item.IDDisciplina && styles.classButtonTextActive,
                    ]}
                  >
                    {item.NomeDaDisciplina}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classButtonList}
            />
          ) : (
            <Text style={styles.noClassesText}>Nenhuma turma disponível</Text>
          )}
        </View>

        {/* Título */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Desempenho da Turma</Text>
          {selectedClass && (
            <Text style={styles.className}>{selectedClass.NomeDaDisciplina}</Text>
          )}
        </View>

        {/* Desempenho Consolidado */}
        <Section title="Desempenho Consolidado">
          <View style={styles.metricsRow}>
            <Card style={styles.metricBox}>
              <Text style={styles.cardLabel}>Média Geral</Text>
              <Text style={styles.cardValue}>
                {dashboard?.metricas.mediaNotas.toFixed(1) || '0.0'}
              </Text>
            </Card>
            <Card style={styles.metricBox}>
              <Text style={styles.cardLabel}>Alunos em Risco</Text>
              <Text style={styles.cardValue}>
                {dashboard?.metricas.percentualRiscoAltoEvasao.toFixed(0) || '0'}%
              </Text>
            </Card>
          </View>
          <Card style={styles.metricBox}>
            <Text style={styles.cardLabel}>Alunos Aprovados</Text>
            <Text style={styles.cardValue}>
              {dashboard?.metricas.percentualAprovados.toFixed(0) || '0'}%
            </Text>
          </Card>
        </Section>

        {/* Distribuição de Notas */}
        <Section title="Distribuição de Notas">
          <View style={styles.distributionContainer}>
            <Text style={styles.distributionSubtitle}>Notas por Aluno</Text>
            <View style={styles.distributionChart}>
            {gradeDistribution.map((item, index) => (
                <View key={item.label || index}>
                  {renderGradeDistribution({ item, index })}
                </View>
              ))}
            </View>
          </View>
        </Section>

        {/* Pontos Fortes e Fracos */}
        {renderPontos(pontosFortes, 'Pontos Fortes')}
        {renderPontos(pontosFracos, 'Pontos Fracos')}

        {/* Botão Exportar */}
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={exporting || !dashboard}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" style={styles.exportIcon} />
          ) : (
            <Feather name="download" size={20} color="#fff" style={styles.exportIcon} />
          )}
          <Text style={styles.exportButtonText}>
            {exporting ? 'Exportando...' : 'Exportar Relatório'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  classButtonList: {
    paddingVertical: 4,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.bg,
  },
  classButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  classButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  noClassesText: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  className: {
    fontSize: 16,
    color: colors.muted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
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
    fontWeight: '600',
  },
  distributionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  distributionSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  distributionChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 8,
  },
  distributionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '80%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    alignSelf: 'center',
  },
  distributionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  distributionValue: {
    fontSize: 11,
    color: colors.muted,
  },
  pontoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pontoIcon: {
    marginRight: 12,
  },
  pontoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    margin: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});