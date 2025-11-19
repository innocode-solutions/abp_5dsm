import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import colors from '../theme/colors';

interface Feedback {
  disciplina: string;
  descricao: string;
  professor: string;
  data?: string;
}

export default function StudentFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      // Mock data - substituir por API real quando disponível
      setFeedbacks([
        {
          disciplina: 'Aprendizagem de Máquina',
          descricao: 'Continue praticando os algoritmos de classificação e regressão',
          professor: 'Professor: Leandro',
          data: '15/01/2024',
        },
        {
          disciplina: 'Computação em Nuvem',
          descricao: 'Bom trabalho nos exercícios de AWS e Azure',
          professor: 'Professor: Ronaldo',
          data: '12/01/2024',
        },
        {
          disciplina: 'Segurança no Desenvolvimento de aplicações',
          descricao: 'Excelente compreensão dos conceitos de segurança e criptografia',
          professor: 'Professor: Arley',
          data: '10/01/2024',
        },
      ]);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Feedbacks</Text>
        <Text style={styles.subtitle}>Acompanhe os feedbacks dos seus professores</Text>

        {feedbacks.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum feedback disponível no momento</Text>
          </View>
        ) : (
          feedbacks.map((feedback, index) => (
            <View key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackContent}>
                <Text style={styles.feedbackDiscipline}>{feedback.disciplina}</Text>
                <Text style={styles.feedbackDescription}>{feedback.descricao}</Text>
                <Text style={styles.feedbackProfessor}>{feedback.professor}</Text>
                {feedback.data && (
                  <Text style={styles.feedbackDate}>{feedback.data}</Text>
                )}
              </View>
              <View style={styles.feedbackImagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📚</Text>
              </View>
            </View>
          ))
        )}
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
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
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
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
  imagePlaceholderText: {
    fontSize: 24,
  },
});

