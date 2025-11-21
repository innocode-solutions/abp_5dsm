import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
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

type StudentDashboardNavigationProp = BottomTabNavigationProp<StudentTabParamList, 'Home'> & 
  NativeStackNavigationProp<RootStackParamList>;

interface Feedback {
  disciplina: string;
  descricao: string;
  professor: string;
}

export default function StudentDashboardScreen() {
  const navigation = useNavigation<StudentDashboardNavigationProp>();
  const { user, logout } = useAuth();
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user?.IDUser) return;
      
      // Primeiro, buscar o ID do aluno associado ao usuário
      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        console.warn('Aluno não encontrado para este usuário');
        setPerformanceScore(null);
        setFeedbacks([]);
        setLoading(false);
        return;
      }
      
      // Buscar dados completos do aluno usando o IDAluno correto
      const studentData = await getStudentDetails(studentId);
      
      // Calcular performance score baseado nas predições de desempenho
      let totalScore = 0;
      let count = 0;
      const feedbacksList: Feedback[] = [];
      
      // Processar todas as matrículas com predições
      studentData.matriculas.forEach((matricula) => {
        const performancePred = matricula.predictions?.find(
          (p) => p.TipoPredicao === 'DESEMPENHO'
        );
        
        if (performancePred) {
          // Converter probabilidade (0-1) para nota (0-10)
          // A probabilidade já representa a nota prevista normalizada
          const nota = performancePred.Probabilidade * 10;
          totalScore += nota;
          count++;
          
          // Criar feedback baseado na predição
          if (performancePred.Classificacao) {
            const notaFormatada = nota.toFixed(1);
            let descricao = '';
            
            if (performancePred.Classificacao === 'APROVADO') {
              descricao = `Excelente! Sua nota prevista é ${notaFormatada}/10. Continue mantendo o bom trabalho e dedicação.`;
            } else if (nota >= 7) {
              descricao = `Bom desempenho previsto (${notaFormatada}/10). Com mais dedicação, você pode melhorar ainda mais!`;
            } else if (nota >= 5) {
              descricao = `Desempenho previsto de ${notaFormatada}/10. Foque em aumentar suas horas de estudo e participação nas aulas.`;
            } else {
              descricao = `Desempenho previsto de ${notaFormatada}/10. É importante aumentar seu engajamento. Procure ajuda dos professores e organize melhor seus estudos.`;
            }
            
            feedbacksList.push({
              disciplina: matricula.disciplina.NomeDaDisciplina,
              descricao,
              professor: `Disciplina: ${matricula.disciplina.NomeDaDisciplina}`,
            });
          }
        }
      });
      
      // Calcular média de desempenho (0-10)
      const averageScore = count > 0 ? totalScore / count : null;
      setPerformanceScore(averageScore);
      
      // Ordenar feedbacks por data (mais recentes primeiro) e limitar a 2
      setFeedbacks(feedbacksList.slice(0, 2));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, manter valores padrão
      setPerformanceScore(null);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const studentName = user?.name || 'Estudante';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentora</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
                await logout();
              }}
            >
              <Feather name="log-out" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Bem-vindo, <Text style={styles.welcomeName}>{studentName}!</Text>
          </Text>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Desempenho</Text>
          {loading ? (
            <Text style={styles.performanceScore}>...</Text>
          ) : (
            <Text style={styles.performanceScore}>
              {performanceScore !== null ? `${performanceScore.toFixed(1)}/10` : 'Sem dados'}
            </Text>
          )}
          {performanceScore !== null && (
            <Text style={styles.performanceSubtext}>
              Baseado em {feedbacks.length} {feedbacks.length === 1 ? 'disciplina' : 'disciplinas'}
            </Text>
          )}
        </View>

        {/* Recent Feedbacks Section */}
        <View style={styles.feedbacksSection}>
          <Text style={styles.sectionTitle}>Feedbacks Recentes</Text>
          {feedbacks.map((feedback, index) => (
            <View key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackContent}>
                <Text style={styles.feedbackDiscipline}>{feedback.disciplina}</Text>
                <Text style={styles.feedbackDescription}>{feedback.descricao}</Text>
                <Text style={styles.feedbackProfessor}>{feedback.professor}</Text>
              </View>
              <View style={styles.feedbackImagePlaceholder}>
                <Feather name="image" size={40} color={colors.muted} />
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.formButton}
            onPress={() => navigation.navigate('Formulário')}
          >
            <Text style={styles.formButtonText}>Responder Formulário</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.evasionButton}
            onPress={() => navigation.navigate('Engagement')}
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
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Espaço para o bottom navigation
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
  performanceSubtext: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
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
  feedbackContent: {
    flex: 1,
  },
  feedbackDiscipline: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  feedbackDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  feedbackProfessor: {
    fontSize: 12,
    color: colors.muted,
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
