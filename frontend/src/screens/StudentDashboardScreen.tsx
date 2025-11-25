import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StudentTabParamList, RootStackParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';
import { getStudentDetails, getStudentIdByUserId } from '../service/studentService';
import { getMyFeedbacks, ApiFeedback } from '../service/feedbackApiService';
import { generatePerformanceFeedback, generateDropoutFeedback } from '../service/FeedbackService';

type StudentDashboardNavigationProp = BottomTabNavigationProp<StudentTabParamList, 'Home'> & 
  NativeStackNavigationProp<RootStackParamList>;

interface Feedback {
  disciplina: string;
  descricao: string;
  professor: string;
  tipo?: 'DESEMPENHO' | 'EVASAO';
  data?: string;
  probabilidade?: number;
  notaPrevista?: number; // Nota prevista (0-10) para exibição
  predicted_score?: number; // Nota prevista (0-100) para lógica de cores/notificações
}

export default function StudentDashboardScreen() {
  const navigation = useNavigation<StudentDashboardNavigationProp>();
  const { user, logout } = useAuth();
  const [performanceScore, setPerformanceScore] = useState<number | null>(null); // Para exibição (0-10)
  const [predictedScore, setPredictedScore] = useState<number | null>(null); // Para lógica de cores (0-100)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('Estudante');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user?.IDUser) return;
      
      // Primeiro, buscar o ID do aluno associado ao usuário
      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        setPerformanceScore(null);
        setFeedbacks([]);
        setLoading(false);
        return;
      }
      
      // Buscar dados completos do aluno usando o IDAluno correto
      const studentData = await getStudentDetails(studentId);
      
      // Armazenar o nome do aluno
      if (studentData.Nome) {
        setStudentName(studentData.Nome);
      }
      
      // Buscar feedbacks da API (mais completo e formatado)
      let apiFeedbacks: ApiFeedback[] = [];
      try {
        apiFeedbacks = await getMyFeedbacks();
      } catch (error) {
      }
      
      // Calcular performance score baseado nas predições de desempenho
      let totalScore = 0; // Para exibição (0-10)
      let totalPredictedScore = 0; // Para lógica de cores (0-100)
      let count = 0;
      const feedbacksList: Feedback[] = [];
      
      // Agrupar feedbacks por disciplina - um por matéria
      const feedbacksPorDisciplina = new Map<string, Feedback>();
      
      // Se temos feedbacks da API, usar eles (mais completo)
      if (apiFeedbacks.length > 0) {
        apiFeedbacks.forEach((apiFeedback) => {
          if (apiFeedback.tipo === 'DESEMPENHO') {
            // Usar notaPrevista para exibição (0-10)
            const nota = apiFeedback.notaPrevista !== undefined 
              ? apiFeedback.notaPrevista 
              : (apiFeedback.predicted_score !== undefined ? apiFeedback.predicted_score / 10 : apiFeedback.probabilidade * 10);
            // Usar predicted_score para lógica de cores (0-100)
            const predictedScore = apiFeedback.predicted_score !== undefined
              ? apiFeedback.predicted_score
              : (apiFeedback.notaPrevista !== undefined ? apiFeedback.notaPrevista * 10 : apiFeedback.probabilidade * 100);
            totalScore += nota;
            totalPredictedScore += predictedScore;
            count++;
            
            // Formatar data
            const dataFormatada = apiFeedback.data 
              ? new Date(apiFeedback.data).toLocaleDateString('pt-BR')
              : undefined;
            
            // Se já existe feedback para esta disciplina, manter apenas o primeiro (ou priorizar DESEMPENHO)
            if (!feedbacksPorDisciplina.has(apiFeedback.disciplina)) {
              // SEMPRE usar FeedbackService para formatar em linguagem natural
              // Isso garante que valores brutos sejam convertidos em mensagens contextualizadas
              const notaPrevista = nota;
              const feedbackFormatado = generatePerformanceFeedback(
                apiFeedback.message || apiFeedback.classificacao || '',
                notaPrevista,
                apiFeedback.classificacao
              );
              const descricaoFormatada = feedbackFormatado.message;
              const tituloFormatado = feedbackFormatado.title;
              
              // Formatar nota de forma mais amigável
              const notaFormatada = nota.toFixed(1);
              let notaTexto = '';
              if (nota >= 9) {
                notaTexto = `Nota prevista: ${notaFormatada}/10 - Excelente! 🎉`;
              } else if (nota >= 7) {
                notaTexto = `Nota prevista: ${notaFormatada}/10 - Muito bom! ⭐`;
              } else if (nota >= 6) {
                notaTexto = `Nota prevista: ${notaFormatada}/10 - Bom 💪`;
              } else {
                notaTexto = `Nota prevista: ${notaFormatada}/10 - ATENÇÃO: Nota abaixo do esperado! ⚠️`;
              }
              
              feedbacksPorDisciplina.set(apiFeedback.disciplina, {
                disciplina: apiFeedback.disciplina,
                descricao: `${tituloFormatado}\n\n${descricaoFormatada}\n\n${notaTexto}`,
                professor: `Análise de Desempenho`,
                tipo: 'DESEMPENHO',
                data: dataFormatada,
                probabilidade: apiFeedback.probabilidade,
                notaPrevista: nota, // Incluir nota prevista (0-10) para exibição
                predicted_score: predictedScore, // Incluir predicted_score (0-100) para lógica de cores
              });
            }
          } else if (apiFeedback.tipo === 'EVASAO') {
            // Formatar feedback de evasão também
            const dataFormatada = apiFeedback.data 
              ? new Date(apiFeedback.data).toLocaleDateString('pt-BR')
              : undefined;
            
            // Se não existe feedback de desempenho para esta disciplina, adicionar evasão
            if (!feedbacksPorDisciplina.has(apiFeedback.disciplina)) {
              // SEMPRE usar FeedbackService para formatar em linguagem natural
              // Isso garante que valores brutos sejam convertidos em mensagens contextualizadas
              const feedbackFormatado = generateDropoutFeedback(
                apiFeedback.message || apiFeedback.classificacao || '',
                apiFeedback.probabilidade,
                apiFeedback.classificacao
              );
              const descricaoFormatada = feedbackFormatado.message;
              const tituloFormatado = feedbackFormatado.title;
              
              // Formatar probabilidade de forma mais amigável
              const probabilidadePercentual = Math.round(apiFeedback.probabilidade * 100);
              let riscoTexto = '';
              if (apiFeedback.probabilidade >= 0.7) {
                riscoTexto = `Risco de evasão: ${probabilidadePercentual}% - Alto ⚠️`;
              } else if (apiFeedback.probabilidade >= 0.4) {
                riscoTexto = `Risco de evasão: ${probabilidadePercentual}% - Médio 💡`;
              } else {
                riscoTexto = `Risco de evasão: ${probabilidadePercentual}% - Baixo ✅`;
              }
              
              feedbacksPorDisciplina.set(apiFeedback.disciplina, {
                disciplina: apiFeedback.disciplina,
                descricao: `${tituloFormatado}\n\n${descricaoFormatada}\n\n${riscoTexto}`,
                professor: `Análise de Risco`,
                tipo: 'EVASAO',
                data: dataFormatada,
                probabilidade: apiFeedback.probabilidade,
              });
            }
          }
        });
      } else {
        // Fallback: processar matrículas diretamente
        studentData.matriculas.forEach((matricula) => {
          const performancePred = matricula.predictions?.find(
            (p) => p.TipoPredicao === 'DESEMPENHO'
          );
          
          if (performancePred) {
            // Usar NotaPrevista para exibição (0-10)
            const nota = matricula.desempenhos && matricula.desempenhos.length > 0
              ? matricula.desempenhos[0].NotaPrevista
              : performancePred.Probabilidade * 10;
            // Usar NotaPercentual (predicted_score) para lógica de cores (0-100)
            const predictedScore = matricula.desempenhos && matricula.desempenhos.length > 0
              ? (matricula.desempenhos[0].NotaPercentual || nota * 10)
              : (performancePred.Probabilidade * 100);
            totalScore += nota;
            totalPredictedScore += predictedScore;
            count++;
            
            // Criar feedback baseado na predição (apenas se não existe para esta disciplina)
            if (performancePred.Classificacao && !feedbacksPorDisciplina.has(matricula.disciplina.NomeDaDisciplina)) {
              const notaFormatada = nota.toFixed(1);
              let descricao = '';
              
              if (performancePred.Classificacao === 'APROVADO') {
                descricao = `Excelente! Sua nota prevista é ${notaFormatada}/10. Continue mantendo o bom trabalho e dedicação.`;
              } else if (nota >= 7) {
                descricao = `Bom desempenho previsto (${notaFormatada}/10). Com mais dedicação, você pode melhorar ainda mais!`;
              } else if (nota >= 6) {
                descricao = `Desempenho previsto de ${notaFormatada}/10. Foque em aumentar suas horas de estudo e participação nas aulas.`;
              } else {
                descricao = `⚠️ ATENÇÃO CRÍTICA: Desempenho previsto de ${notaFormatada}/10 está ABAIXO DO ESPERADO! É URGENTE aumentar seu engajamento, frequência às aulas e horas de estudo. Procure ajuda dos professores IMEDIATAMENTE e reorganize seus estudos!`;
              }
              
              const dataFormatada = performancePred.createdAt 
                ? new Date(performancePred.createdAt).toLocaleDateString('pt-BR')
                : undefined;
              
              feedbacksPorDisciplina.set(matricula.disciplina.NomeDaDisciplina, {
                disciplina: matricula.disciplina.NomeDaDisciplina,
                descricao,
                professor: `Disciplina: ${matricula.disciplina.NomeDaDisciplina}`,
                tipo: 'DESEMPENHO',
                data: dataFormatada,
                probabilidade: performancePred.Probabilidade,
                notaPrevista: nota, // Incluir nota prevista (0-10) para exibição
                predicted_score: predictedScore, // Incluir predicted_score (0-100) para lógica de cores
              });
            }
          }
        });
      }
      
      // Converter Map para Array (um feedback por disciplina)
      const feedbacksArray = Array.from(feedbacksPorDisciplina.values());
      
      // Calcular média de desempenho (0-10) para exibição
      const averageScore = count > 0 ? totalScore / count : null;
      // Calcular média do predicted_score (0-100) para lógica de cores
      const averagePredictedScore = count > 0 ? totalPredictedScore / count : null;
      setPerformanceScore(averageScore);
      setPredictedScore(averagePredictedScore);
      
      // Log para debug
      
      // Ordenar feedbacks por data (mais recentes primeiro) e limitar a 2
      feedbacksArray.sort((a, b) => {
        if (!a.data || !b.data) return 0;
        return new Date(b.data.split('/').reverse().join('-')).getTime() - 
               new Date(a.data.split('/').reverse().join('-')).getTime();
      });
      
      setFeedbacks(feedbacksArray.slice(0, 2));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, manter valores padrão
      setPerformanceScore(null);
      setPredictedScore(null);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Bem-vindo, <Text style={styles.welcomeName}>{studentName}!</Text>
          </Text>
        </View>

        {/* Performance Card */}
        <View style={[
          styles.performanceCard,
          predictedScore !== null && predictedScore < 60 && styles.performanceCardCritical
        ]}>
          <Text style={styles.performanceLabel}>Desempenho Geral</Text>
          {loading ? (
            <Text style={styles.performanceScore}>...</Text>
          ) : (
            <>
              <Text style={[
                styles.performanceScore,
                predictedScore !== null && predictedScore < 60 && styles.performanceScoreCritical
              ]}>
                {performanceScore !== null ? `${performanceScore.toFixed(1)}/10` : 'Sem dados'}
              </Text>
              {performanceScore !== null && (
                <>
                  <Text style={[
                    styles.performanceSubtext,
                    predictedScore !== null && predictedScore < 60 && styles.performanceSubtextCritical
                  ]}>
                    {predictedScore !== null && predictedScore >= 90 
                      ? 'Excelente desempenho! Continue assim! 🎉'
                      : predictedScore !== null && predictedScore >= 70
                      ? 'Bom desempenho! Você está no caminho certo! ⭐'
                      : predictedScore !== null && predictedScore >= 60
                      ? 'Desempenho regular. Com dedicação, você pode melhorar! 💪'
                      : 'ATENÇÃO: Desempenho abaixo do esperado! É urgente aumentar seu engajamento e dedicação aos estudos! ⚠️'
                    }
                  </Text>
                  <Text style={styles.performanceSubtext}>
                    Baseado em {feedbacks.length} {feedbacks.length === 1 ? 'disciplina' : 'disciplinas'} com predições
                  </Text>
                </>
              )}
            </>
          )}
        </View>

        {/* Recent Feedbacks Section */}
        <View style={styles.feedbacksSection}>
          <Text style={styles.sectionTitle}>Feedbacks Recentes</Text>
          {feedbacks.length === 0 && !loading ? (
            <View style={styles.emptyFeedbackContainer}>
              <Feather name="inbox" size={32} color={colors.muted} />
              <Text style={styles.emptyFeedbackText}>
                Nenhum feedback disponível ainda
              </Text>
              <Text style={styles.emptyFeedbackSubtext}>
                Complete o formulário de hábitos para gerar predições
              </Text>
            </View>
          ) : (
            feedbacks.map((feedback, index) => {
              // Separar título, mensagem e nota/risco da descrição
              const partes = feedback.descricao.split('\n\n');
              const titulo = partes[0] || feedback.disciplina;
              const mensagem = partes[1] || feedback.descricao;
              const notaRisco = partes[2] || '';
              
              // Verificar se é crítico usando predicted_score (0-100) para DESEMPENHO
              // predicted_score < 60 = nota < 6.0
              const predictedScore = feedback.tipo === 'DESEMPENHO'
                ? (feedback.predicted_score !== undefined ? feedback.predicted_score : (feedback.notaPrevista !== undefined ? feedback.notaPrevista * 10 : feedback.probabilidade * 100))
                : null;
              const isCritical = feedback.tipo === 'DESEMPENHO'
                ? (predictedScore !== null && predictedScore < 60)
                : feedback.probabilidade >= 0.7;
              
              // Verificar se é positivo (nota >= 6 para desempenho, ou baixo risco para evasão)
              const isPositive = feedback.tipo === 'DESEMPENHO' 
                ? !isCritical 
                : (feedback.probabilidade < 0.4); // Baixo risco de evasão = positivo
              
              // Extrair nota se for desempenho
              // Usar notaPrevista para exibição (0-10), mas predicted_score para lógica
              const nota = feedback.tipo === 'DESEMPENHO' 
                ? (feedback.notaPrevista !== undefined ? feedback.notaPrevista : (feedback.predicted_score !== undefined ? feedback.predicted_score / 10 : feedback.probabilidade * 10))
                : null;
              
              return (
                <View key={index} style={[
                  styles.feedbackCard,
                  isCritical && styles.feedbackCardCritical,
                  isPositive && styles.feedbackCardPositive
                ]}>
                  <View style={styles.feedbackContent}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackDiscipline}>{feedback.disciplina}</Text>
                      {feedback.data && (
                        <Text style={styles.feedbackDate}>{feedback.data}</Text>
                      )}
                    </View>
                    {titulo !== feedback.disciplina && (
                      <Text style={[
                        styles.feedbackTitle,
                        isCritical && styles.feedbackTitleCritical
                      ]}>{titulo}</Text>
                    )}
                    <Text style={[
                      styles.feedbackDescription,
                      isCritical && styles.feedbackDescriptionCritical
                    ]}>{mensagem}</Text>
                    {notaRisco && (
                      <View style={[
                        styles.notaRiscoContainer,
                        isCritical && styles.notaRiscoContainerCritical,
                        isPositive && styles.notaRiscoContainerPositive
                      ]}>
                        <Text style={[
                          styles.notaRiscoText,
                          isCritical && styles.notaRiscoTextCritical,
                          isPositive && styles.notaRiscoTextPositive
                        ]}>{notaRisco}</Text>
                      </View>
                    )}
                    <View style={styles.feedbackFooter}>
                      <Feather 
                        name={
                          feedback.tipo === 'EVASAO' 
                            ? (isPositive ? 'check-circle' : (isCritical ? 'alert-triangle' : 'info'))
                            : (isCritical ? 'trending-down' : 'check-circle')
                        } 
                        size={14} 
                        color={
                          isCritical 
                            ? '#E53935' 
                            : isPositive
                              ? '#2E7D32' // Verde para positivo (desempenho ou evasão baixo risco)
                              : feedback.tipo === 'EVASAO' 
                                ? '#FF9800' // Laranja para evasão médio risco
                                : '#2E7D32'
                        } 
                      />
                      <Text style={[
                        styles.feedbackProfessor,
                        isCritical && styles.feedbackProfessorCritical,
                        isPositive && styles.feedbackProfessorPositive
                      ]}>{feedback.professor}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.feedbackImagePlaceholder,
                    isCritical 
                      ? styles.feedbackImagePlaceholderCritical
                      : isPositive
                        ? styles.feedbackImagePlaceholderSuccess
                        : feedback.tipo === 'EVASAO' 
                          ? styles.feedbackImagePlaceholderWarning 
                          : styles.feedbackImagePlaceholderSuccess
                  ]}>
                    <Feather 
                      name={
                        feedback.tipo === 'EVASAO' 
                          ? (isPositive ? 'check-circle' : (isCritical ? 'alert-triangle' : 'info'))
                          : (isCritical ? 'trending-down' : 'check-circle')
                      } 
                      size={32} 
                      color={
                        isCritical 
                          ? '#E53935' 
                          : isPositive
                            ? '#2E7D32' // Verde para positivo (desempenho ou evasão baixo risco)
                            : feedback.tipo === 'EVASAO' 
                              ? '#FF9800' // Laranja para evasão médio risco
                              : '#2E7D32'
                      } 
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.formButton}
            onPress={() => navigation.navigate('SelectSubject', {
              returnTo: 'Habits',
              title: 'Selecione a matéria para calcular o desempenho'
            })}
          >
            <Text style={styles.formButtonText}>Formulário</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.evasionButton}
            onPress={() => navigation.navigate('SelectSubject', { 
              returnTo: 'Engagement',
              title: 'Selecione a matéria para calcular o risco de evasão'
            })}
          >
            <Text style={styles.evasionButtonText}>Ver Chance de Evasão</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 80, // Espaço para o bottom navigation (ajustado)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  logoutButton: {
    padding: 4,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    color: colors.text,
  },
  welcomeName: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  performanceCardCritical: {
    borderWidth: 2,
    borderColor: '#E53935',
    backgroundColor: '#fff5f5',
  },
  performanceLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  performanceScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#17a2b8', // Teal/green color
  },
  performanceScoreCritical: {
    color: '#E53935', // Red color for critical
  },
  performanceSubtext: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  performanceSubtextCritical: {
    color: '#E53935',
    fontWeight: '600',
  },
  feedbacksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackCardCritical: {
    borderWidth: 2,
    borderColor: '#E53935',
    backgroundColor: '#fff5f5',
  },
  feedbackCardPositive: {
    borderWidth: 2,
    borderColor: '#2E7D32', // Verde escuro para positivo
    backgroundColor: '#f1f8f4', // Verde muito claro para fundo
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackDiscipline: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  feedbackDate: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  feedbackTitleCritical: {
    color: '#E53935',
  },
  feedbackDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  feedbackDescriptionCritical: {
    color: '#C62828',
    fontWeight: '500',
  },
  notaRiscoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  notaRiscoContainerCritical: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#E53935',
  },
  notaRiscoContainerPositive: {
    backgroundColor: '#e8f5e9', // Verde claro para destacar
    borderLeftColor: '#2E7D32', // Borda verde escura
  },
  notaRiscoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  notaRiscoTextCritical: {
    color: '#E53935',
  },
  notaRiscoTextPositive: {
    color: '#2E7D32', // Verde escuro em evidência
    fontWeight: '700',
  },
  feedbackProfessorCritical: {
    color: '#E53935',
  },
  feedbackProfessorPositive: {
    color: '#2E7D32', // Verde escuro para destacar desempenho positivo
    fontWeight: '600',
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackProfessor: {
    fontSize: 12,
    color: colors.muted,
  },
  emptyFeedbackContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyFeedbackText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
    fontWeight: '600',
  },
  emptyFeedbackSubtext: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  feedbackImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  feedbackImagePlaceholderSuccess: {
    backgroundColor: '#c8e6c9', // Verde mais vibrante e em evidência
    borderWidth: 2,
    borderColor: '#2E7D32', // Borda verde escura para destacar
  },
  feedbackImagePlaceholderWarning: {
    backgroundColor: '#fff3e0',
  },
  feedbackImagePlaceholderCritical: {
    backgroundColor: '#ffebee',
  },
  buttonsContainer: {
    gap: 12,
  },
  formButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  formButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  evasionButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  evasionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
