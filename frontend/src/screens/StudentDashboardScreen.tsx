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
import { StudentTabParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';

type StudentDashboardNavigationProp = BottomTabNavigationProp<StudentTabParamList, 'Home'>;

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
      const token = await getToken();
      // Buscar dados do aluno e suas predições para calcular desempenho
      // Por enquanto, vamos usar um valor mockado ou buscar das predições
      setPerformanceScore(8.5); // Mock - substituir por lógica real
      
      // Feedbacks mockados - substituir por API real quando disponível
      setFeedbacks([
        {
          disciplina: 'Matemática',
          descricao: 'Excelente progresso na álgebra',
          professor: 'Professor: Dr. Silva',
        },
        {
          disciplina: 'Física',
          descricao: 'Bom trabalho em mecânica',
          professor: 'Professor: Dra. Oliveira',
        },
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
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
            <TouchableOpacity style={styles.bellButton}>
              <Feather name="bell" size={24} color={colors.text} />
            </TouchableOpacity>
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
          <Text style={styles.performanceScore}>
            {performanceScore !== null ? performanceScore.toFixed(1) : '--'}
          </Text>
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

        {/* Answer Form Button */}
          <TouchableOpacity
            style={styles.formButton}
            onPress={() => navigation.navigate('Formulário')}
          >
            <Text style={styles.formButtonText}>Responder Formulário</Text>
          </TouchableOpacity>
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
  bellButton: {
    padding: 4,
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
});
