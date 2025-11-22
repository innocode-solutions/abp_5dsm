import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getStudentDetails, getStudentIdByUserId } from '../service/studentService';

interface Feedback {
  disciplina: string;
  descricao: string;
  professor: string;
  data?: string;
}

export default function StudentFeedbacksScreen() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.IDUser) {
      loadFeedbacks();
    }
  }, [user]);

  const loadFeedbacks = async () => {
    try {
      if (!user?.IDUser) return;
      
      // Primeiro, buscar o ID do aluno associado ao usuário
      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        console.warn('Aluno não encontrado para este usuário');
        setFeedbacks([]);
        setLoading(false);
        return;
      }
      
      // Buscar dados completos do aluno usando o IDAluno correto
      const studentData = await getStudentDetails(studentId);
      
      // Gerar feedbacks baseados nas predições
      const feedbacksList: Feedback[] = [];
      
      studentData.matriculas.forEach((matricula) => {
        const performancePred = matricula.predictions?.find(
          (p) => p.TipoPredicao === 'DESEMPENHO'
        );
        const dropoutPred = matricula.predictions?.find(
          (p) => p.TipoPredicao === 'EVASAO'
        );
        
        if (performancePred || dropoutPred) {
          let descricao = '';
          
          if (performancePred) {
            const nota = Math.round(performancePred.Probabilidade * 1000) / 10;
            if (nota >= 8) {
              descricao = `Excelente desempenho previsto (${nota.toFixed(1)}/10)! Continue mantendo o bom trabalho e dedicação.`;
            } else if (nota >= 6) {
              descricao = `Bom desempenho previsto (${nota.toFixed(1)}/10). Com mais dedicação, você pode melhorar ainda mais!`;
            } else {
              descricao = `Desempenho previsto de ${nota.toFixed(1)}/10. Foque em aumentar suas horas de estudo e participação nas aulas.`;
            }
          }
          
          if (dropoutPred) {
            const risco = dropoutPred.Probabilidade;
            if (risco >= 0.66) {
              descricao += (descricao ? ' ' : '') + '⚠️ Risco de evasão alto detectado. Procure se engajar mais com as atividades e manter contato com professores.';
            } else if (risco >= 0.33) {
              descricao += (descricao ? ' ' : '') + 'Risco de evasão moderado. Continue participando ativamente das aulas.';
            }
          }
          
          if (descricao) {
            const dataPredicao = performancePred?.createdAt || dropoutPred?.createdAt;
            const dataFormatada = dataPredicao 
              ? new Date(dataPredicao).toLocaleDateString('pt-BR')
              : undefined;
            
            feedbacksList.push({
              disciplina: matricula.disciplina.NomeDaDisciplina,
              descricao,
              professor: `Disciplina: ${matricula.disciplina.NomeDaDisciplina}`,
              data: dataFormatada,
            });
          }
        }
      });
      
      // Ordenar por data (mais recentes primeiro)
      feedbacksList.sort((a, b) => {
        if (!a.data || !b.data) return 0;
        return new Date(b.data.split('/').reverse().join('-')).getTime() - 
               new Date(a.data.split('/').reverse().join('-')).getTime();
      });
      
      setFeedbacks(feedbacksList);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      setFeedbacks([]);
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

