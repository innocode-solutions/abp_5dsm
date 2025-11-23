import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getStudentDetails, getStudentIdByUserId } from '../service/studentService';
import { getMyFeedbacks, ApiFeedback } from '../service/feedbackApiService';
import Carousel from '../components/Carousel';
import { Feather } from '@expo/vector-icons';
import { generatePerformanceFeedback, generateDropoutFeedback } from '../service/FeedbackService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CARD_WIDTH = 900; // Largura máxima para desktop
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, MAX_CARD_WIDTH);

interface Feedback {
  disciplina: string;
  descricao: string;
  professor: string;
  data?: string;
  tipo?: 'DESEMPENHO' | 'EVASAO';
  probabilidade?: number; // Adicionar probabilidade para determinar positivo/negativo
  notaPrevista?: number; // Nota prevista (0-10) para exibição
  predicted_score?: number; // Nota prevista (0-100) para lógica de cores/notificações
  feedback?: {
    title: string;
    message: string;
    features: Array<{
      feature: string;
      value: string | number;
      influence: 'positiva' | 'negativa';
    }>;
    suggestions: string[];
  };
}

export default function StudentFeedbacksScreen() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('Estudante');

  useEffect(() => {
    if (user?.IDUser) {
      loadStudentName();
      loadFeedbacks();
    }
  }, [user]);

  const loadStudentName = async () => {
    try {
      if (!user?.IDUser) return;
      
      const studentId = await getStudentIdByUserId();
      if (!studentId) return;
      
      const studentData = await getStudentDetails(studentId);
      if (studentData.Nome) {
        setStudentName(studentData.Nome);
      }
    } catch (error) {
      // Silenciar erro
    }
  };

  const loadFeedbacks = async () => {
    try {
      if (!user?.IDUser) return;
      
      // Tentar buscar feedbacks da API primeiro (mais completo)
      let apiFeedbacks: ApiFeedback[] = [];
      try {
        apiFeedbacks = await getMyFeedbacks();
      } catch (error) {
      }
      
      // Agrupar feedbacks por disciplina - um por matéria
      // Priorizar DESEMPENHO sobre EVASAO, e mais recente sobre mais antigo
      const feedbacksPorDisciplina = new Map<string, Feedback>();
      
      // Se temos feedbacks da API, usar eles
      if (apiFeedbacks.length > 0) {
        // Ordenar por data (mais recentes primeiro) e por tipo (DESEMPENHO primeiro)
        const sortedFeedbacks = [...apiFeedbacks].sort((a, b) => {
          // Primeiro por tipo (DESEMPENHO vem antes de EVASAO)
          if (a.tipo !== b.tipo) {
            return a.tipo === 'DESEMPENHO' ? -1 : 1;
          }
          // Depois por data (mais recente primeiro)
          const dateA = a.data ? new Date(a.data).getTime() : 0;
          const dateB = b.data ? new Date(b.data).getTime() : 0;
          return dateB - dateA;
        });
        
        sortedFeedbacks.forEach((apiFeedback) => {
          // Se já existe feedback para esta disciplina, pular (já temos o melhor)
          if (feedbacksPorDisciplina.has(apiFeedback.disciplina)) {
            return;
          }
          
          // Gerar feedback formatado usando FeedbackService
          let formattedFeedback;
          
          if (apiFeedback.tipo === 'DESEMPENHO') {
            // Usar notaPrevista se disponível, senão converter probabilidade (fallback)
            const notaPrevista = apiFeedback.notaPrevista !== undefined 
              ? apiFeedback.notaPrevista 
              : apiFeedback.probabilidade * 10;
            formattedFeedback = generatePerformanceFeedback(
              apiFeedback.message || apiFeedback.title,
              notaPrevista,
              apiFeedback.classificacao
            );
          } else {
            formattedFeedback = generateDropoutFeedback(
              apiFeedback.message || apiFeedback.title,
              apiFeedback.probabilidade,
              apiFeedback.classificacao
            );
          }
          
          const dataFormatada = apiFeedback.data 
            ? new Date(apiFeedback.data).toLocaleDateString('pt-BR')
            : undefined;
          
          // Para desempenho, incluir predicted_score e notaPrevista
          const notaPrevista = apiFeedback.tipo === 'DESEMPENHO' 
            ? (apiFeedback.notaPrevista !== undefined ? apiFeedback.notaPrevista : apiFeedback.probabilidade * 10)
            : undefined;
          const predictedScore = apiFeedback.tipo === 'DESEMPENHO'
            ? (apiFeedback.predicted_score !== undefined ? apiFeedback.predicted_score : (notaPrevista !== undefined ? notaPrevista * 10 : apiFeedback.probabilidade * 100))
            : undefined;
          
          feedbacksPorDisciplina.set(apiFeedback.disciplina, {
            disciplina: apiFeedback.disciplina,
            descricao: formattedFeedback.message,
            professor: `${apiFeedback.tipo === 'DESEMPENHO' ? 'Desempenho' : 'Risco de Evasão'} - ${apiFeedback.disciplina}`,
            data: dataFormatada,
            tipo: apiFeedback.tipo,
            probabilidade: apiFeedback.probabilidade, // Incluir probabilidade para determinar cores
            notaPrevista: notaPrevista, // Incluir nota prevista (0-10) para exibição
            predicted_score: predictedScore, // Incluir predicted_score (0-100) para lógica de cores
            feedback: {
              title: formattedFeedback.title,
              message: formattedFeedback.message,
              features: apiFeedback.features.length > 0 ? apiFeedback.features : formattedFeedback.features,
              suggestions: apiFeedback.suggestions.length > 0 ? apiFeedback.suggestions : formattedFeedback.suggestions,
            },
          });
        });
      } else {
        // Fallback: buscar dados do aluno diretamente
        const studentId = await getStudentIdByUserId();
        if (!studentId) {
          setFeedbacks([]);
          setLoading(false);
          return;
        }
        
        const studentData = await getStudentDetails(studentId);
        
        // Gerar feedbacks baseados nas predições usando FeedbackService
        // Priorizar DESEMPENHO sobre EVASAO para cada disciplina
        studentData.matriculas.forEach((matricula) => {
          // Se já existe feedback para esta disciplina, pular
          if (feedbacksPorDisciplina.has(matricula.disciplina.NomeDaDisciplina)) {
            return;
          }
          
          const performancePred = matricula.predictions?.find(
            (p) => p.TipoPredicao === 'DESEMPENHO'
          );
          const dropoutPred = matricula.predictions?.find(
            (p) => p.TipoPredicao === 'EVASAO'
          );
          
          // Priorizar feedback de desempenho
          if (performancePred) {
            // Usar NotaPrevista para exibição (0-10)
            const notaPrevista = matricula.desempenhos && matricula.desempenhos.length > 0
              ? matricula.desempenhos[0].NotaPrevista
              : performancePred.Probabilidade * 10;
            // Usar NotaPercentual (predicted_score) para lógica de cores (0-100)
            const predictedScore = matricula.desempenhos && matricula.desempenhos.length > 0
              ? (matricula.desempenhos[0].NotaPercentual || notaPrevista * 10)
              : (performancePred.Probabilidade * 100);
            const feedback = generatePerformanceFeedback(
              '', // Explicacao não está disponível no tipo predictions
              notaPrevista,
              performancePred.Classificacao
            );
            
            const dataPredicao = performancePred.createdAt;
            const dataFormatada = dataPredicao 
              ? new Date(dataPredicao).toLocaleDateString('pt-BR')
              : undefined;
            
            feedbacksPorDisciplina.set(matricula.disciplina.NomeDaDisciplina, {
              disciplina: matricula.disciplina.NomeDaDisciplina,
              descricao: feedback.message,
              professor: `Desempenho - ${matricula.disciplina.NomeDaDisciplina}`,
              data: dataFormatada,
              tipo: 'DESEMPENHO',
              probabilidade: performancePred.Probabilidade, // Incluir probabilidade
              notaPrevista: notaPrevista, // Incluir nota prevista (0-10) para exibição
              predicted_score: predictedScore, // Incluir predicted_score (0-100) para lógica de cores
              feedback: {
                title: feedback.title,
                message: feedback.message,
                features: feedback.features,
                suggestions: feedback.suggestions,
              },
            });
          } else if (dropoutPred) {
            // Se não tem desempenho, usar evasão
            const feedback = generateDropoutFeedback(
              '', // Explicacao não está disponível no tipo predictions
              dropoutPred.Probabilidade,
              dropoutPred.Classificacao
            );
            
            const dataPredicao = dropoutPred.createdAt;
            const dataFormatada = dataPredicao 
              ? new Date(dataPredicao).toLocaleDateString('pt-BR')
              : undefined;
            
            feedbacksPorDisciplina.set(matricula.disciplina.NomeDaDisciplina, {
              disciplina: matricula.disciplina.NomeDaDisciplina,
              descricao: feedback.message,
              professor: `Risco de Evasão - ${matricula.disciplina.NomeDaDisciplina}`,
              data: dataFormatada,
              tipo: 'EVASAO',
              probabilidade: dropoutPred.Probabilidade, // Incluir probabilidade
              feedback: {
                title: feedback.title,
                message: feedback.message,
                features: feedback.features,
                suggestions: feedback.suggestions,
              },
            });
          }
        });
      }
      
      // Converter Map para Array (um feedback por disciplina)
      const feedbacksArray = Array.from(feedbacksPorDisciplina.values());
      
      // Ordenar por data (mais recentes primeiro)
      feedbacksArray.sort((a, b) => {
        if (!a.data || !b.data) return 0;
        return new Date(b.data.split('/').reverse().join('-')).getTime() - 
               new Date(a.data.split('/').reverse().join('-')).getTime();
      });
      
      setFeedbacks(feedbacksArray);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderFeedbackCard = (feedback: Feedback, index: number) => {
    const isEvasion = feedback.tipo === 'EVASAO';
    
    // Para DESEMPENHO: usar predicted_score (0-100) - negativo se < 60, positivo se >= 60
    // Para EVASAO: probabilidade (0-1) - negativo se >= 0.4, positivo se < 0.4
    let isCritical = false;
    let isPositive = false;
    
    if (isEvasion) {
      // Para evasão: usar probabilidade
      if (feedback.probabilidade !== undefined && feedback.probabilidade !== null) {
        isCritical = feedback.probabilidade >= 0.4; // Risco médio ou alto
        isPositive = feedback.probabilidade < 0.4; // Risco baixo = positivo
      }
    } else {
      // Para desempenho: PRIORIZAR predicted_score (0-100) para lógica de cores
      const predictedScore = feedback.predicted_score !== undefined
        ? feedback.predicted_score
        : (feedback.notaPrevista !== undefined 
            ? feedback.notaPrevista * 10 
            : (feedback.probabilidade !== undefined && feedback.probabilidade !== null
                ? feedback.probabilidade * 100
                : null));
      
      if (predictedScore !== null && !isNaN(predictedScore)) {
        isCritical = predictedScore < 60; // Nota abaixo de 60 (equivalente a 6.0) = negativo
        isPositive = predictedScore >= 60; // Nota 60 ou acima (equivalente a 6.0) = positivo
      }
    }
    
    // Fallback: se não conseguiu determinar com predicted_score/probabilidade, tentar extrair da mensagem
    if (!isCritical && !isPositive) {
      const message = feedback.feedback?.message || feedback.descricao || '';
      const msgLower = message.toLowerCase();
      
      // Tentar extrair nota/probabilidade da mensagem
      let notaOuProbabilidade: number | null = null;
      const notaMatch = message.match(/nota.*?(\d+[.,]\d+|\d+)/i);
      const probMatch = message.match(/(\d+[.,]\d+|\d+)\s*%/);
      
      if (notaMatch) {
        notaOuProbabilidade = parseFloat(notaMatch[1].replace(',', '.'));
      } else if (probMatch) {
        notaOuProbabilidade = parseFloat(probMatch[1].replace(',', '.')) / 100;
      }
      
      if (isEvasion) {
        // Para evasão, verificar probabilidade extraída ou palavras-chave
        if (notaOuProbabilidade !== null) {
          isCritical = notaOuProbabilidade >= 0.4; // Risco médio ou alto
          isPositive = notaOuProbabilidade < 0.4; // Risco baixo
        } else {
          // Fallback: verificar palavras-chave
          isCritical = msgLower.includes('alto') || 
                       msgLower.includes('crítico') ||
                       msgLower.includes('urgente') ||
                       msgLower.includes('risco');
          isPositive = msgLower.includes('baixo') && !isCritical;
        }
      } else {
        // Para desempenho, verificar nota extraída ou palavras-chave
        if (notaOuProbabilidade !== null) {
          // Se for nota em escala 0-10, converter para 0-100 para comparação
          const scoreParaComparacao = notaOuProbabilidade <= 10 ? notaOuProbabilidade * 10 : notaOuProbabilidade;
          isCritical = scoreParaComparacao < 60; // Nota abaixo de 60 (equivalente a 6.0)
          isPositive = scoreParaComparacao >= 60; // Nota 60 ou acima (equivalente a 6.0)
        } else {
          // Fallback: verificar palavras-chave
          isCritical = msgLower.includes('crítico') ||
                       msgLower.includes('urgente') ||
                       msgLower.includes('abaixo do esperado') ||
                       msgLower.includes('risco') ||
                       msgLower.includes('atenção');
          isPositive = !isCritical && (
            msgLower.includes('excelente') ||
            msgLower.includes('bom') ||
            msgLower.includes('parabéns') ||
            msgLower.includes('ótimo') ||
            msgLower.includes('muito bom') ||
            msgLower.includes('continue assim')
          );
        }
      }
    }
    
    // NÃO assumir positivo automaticamente - se não conseguiu determinar, verificar novamente
    // Se ainda não conseguiu e é desempenho, verificar se há features negativas ou palavras-chave na mensagem
    if (!isCritical && !isPositive && !isEvasion) {
      // Se há features negativas no feedback, considerar crítico
      if (feedback.feedback?.features && feedback.feedback.features.length > 0) {
        const hasNegativeFeatures = feedback.feedback.features.some(f => f.influence === 'negativa');
        const negativeFeaturesCount = feedback.feedback.features.filter(f => f.influence === 'negativa').length;
        const positiveFeaturesCount = feedback.feedback.features.filter(f => f.influence === 'positiva').length;
        
        // Se há mais features negativas ou igual número, considerar crítico
        if (hasNegativeFeatures && negativeFeaturesCount >= positiveFeaturesCount) {
          isCritical = true;
        } else if (positiveFeaturesCount > negativeFeaturesCount) {
          // Se há mais features positivas, considerar positivo
          isPositive = true;
        } else if (hasNegativeFeatures) {
          // Se há features negativas mesmo que em menor número, considerar crítico se não há predicted_score
          isCritical = true;
        }
      } else {
        // Se não há features, verificar palavras-chave na mensagem
        const message = feedback.feedback?.message || feedback.descricao || '';
        const msgLower = message.toLowerCase();
        if (msgLower.includes('crítico') || msgLower.includes('urgente') || 
            msgLower.includes('abaixo do esperado') || msgLower.includes('atenção') ||
            msgLower.includes('risco') || msgLower.includes('reprovação')) {
          isCritical = true;
        }
      }
    }
    
    // Ícone: se for evasão = alert-triangle, se for desempenho crítico = trending-down, se positivo = trending-up, senão = trending-up
    const iconName = isEvasion 
      ? 'alert-triangle' 
      : (isCritical ? 'trending-down' : 'trending-up');
    
    // Cores: crítico = vermelho, positivo = verde, evasão = laranja, padrão = azul
    const iconColor = isCritical 
      ? '#E53935' 
      : isPositive 
        ? '#2E7D32' // Verde escuro para positivo
        : isEvasion 
          ? '#FF9800' 
          : colors.primary || "#4A90E2";
    
    const iconBgColor = isCritical 
      ? '#ffebee' 
      : isPositive 
        ? '#c8e6c9' // Verde claro para positivo
        : isEvasion 
          ? '#FFF3E0' 
          : '#E3F2FD';
    
    // Garantir que sempre tenha uma cor definida
    // Se não for crítico nem positivo, usar estilo padrão (branco)
    const cardStyle = [
      styles.feedbackCard,
      isCritical && styles.feedbackCardCritical,
      isPositive && styles.feedbackCardPositive
    ];
    
    return (
      <View style={cardStyle}>
        <View style={styles.feedbackHeaderCard}>
          <View style={[styles.feedbackIconContainer, { backgroundColor: iconBgColor }]}>
            <Feather name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.feedbackTitleContainer}>
            <Text 
              style={[
                styles.feedbackDiscipline,
                isCritical && styles.feedbackDisciplineCritical,
                isPositive && styles.feedbackDisciplinePositive
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {feedback.disciplina}
            </Text>
            {feedback.data && (
              <Text style={styles.feedbackDate}>{feedback.data}</Text>
            )}
          </View>
        </View>
        
        {feedback.feedback && (
          <ScrollView 
            style={styles.feedbackContent}
            contentContainerStyle={styles.feedbackContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text 
              style={[
                styles.feedbackTitle,
                isCritical && styles.feedbackTitleCritical,
                isPositive && styles.feedbackTitlePositive
              ]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {feedback.feedback.title}
            </Text>
            <Text 
              style={[
                styles.feedbackDescription,
                isCritical && styles.feedbackDescriptionCritical,
                isPositive && styles.feedbackDescriptionPositive
              ]}
            >
              {feedback.feedback.message}
            </Text>
            
            {feedback.feedback.features.length > 0 && (
              <>
                {/* Separar features negativas e positivas */}
                {feedback.feedback.features.filter(f => f.influence === 'negativa').length > 0 && (
                  <View style={[styles.featuresContainer, isCritical && styles.featuresContainerCritical]}>
                    <Text style={[styles.featuresTitle, isCritical && styles.featuresTitleCritical]}>
                      ⚠️ Pontos que precisam de atenção:
                    </Text>
                    {feedback.feedback.features
                      .filter(f => f.influence === 'negativa')
                      .map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Feather 
                            name="arrow-down-circle" 
                            size={18} 
                            color="#F44336" 
                          />
                          <Text style={styles.featureText} numberOfLines={0}>
                            <Text style={[styles.featureName, { color: '#F44336', fontWeight: '700' }]}>
                              {feature.feature}
                            </Text>
                            {': '}
                            <Text style={[styles.featureValue, { color: '#F44336', fontWeight: '600' }]}>
                              {feature.value} (impacto negativo)
                            </Text>
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
                
                {/* Features positivas */}
                {feedback.feedback.features.filter(f => f.influence === 'positiva').length > 0 && (
                  <View style={[styles.featuresContainer, isPositive && styles.featuresContainerPositive]}>
                    <Text style={[styles.featuresTitle, isPositive && styles.featuresTitlePositive]}>
                      ✅ Pontos fortes:
                    </Text>
                    {feedback.feedback.features
                      .filter(f => f.influence === 'positiva')
                      .map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Feather 
                            name="arrow-up-circle" 
                            size={18} 
                            color="#4CAF50" 
                          />
                          <Text style={styles.featureText} numberOfLines={0}>
                            <Text style={[styles.featureName, { color: '#4CAF50', fontWeight: '700' }]}>
                              {feature.feature}
                            </Text>
                            {': '}
                            <Text style={[styles.featureValue, { color: '#4CAF50', fontWeight: '600' }]}>
                              {feature.value} (impacto positivo)
                            </Text>
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
              </>
            )}
            
            {feedback.feedback.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Sugestões:</Text>
                {feedback.feedback.suggestions.map((suggestion, idx) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text style={styles.suggestionText}>• {suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
        
        {!feedback.feedback && (
          <View style={styles.feedbackContent}>
            <Text style={[
              styles.feedbackDescription,
              isCritical && styles.feedbackDescriptionCritical,
              isPositive && styles.feedbackDescriptionPositive
            ]}>{feedback.descricao}</Text>
          </View>
        )}
        
        <View style={styles.feedbackFooter}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {studentName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text 
            style={[
              styles.feedbackProfessor,
              isCritical && styles.feedbackProfessorCritical,
              isPositive && styles.feedbackProfessorPositive
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {studentName}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Feedbacks</Text>
          <Text style={styles.subtitle}>Acompanhe os feedbacks dos seus professores</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando feedbacks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Feedbacks</Text>
          <Text style={styles.subtitle}>Acompanhe os feedbacks dos seus professores</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color={colors.muted} />
          <Text style={styles.emptyText}>Nenhum feedback disponível no momento</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Acompanhe os feedbacks dos seus professores</Text>
      </View>
      <View style={styles.carouselContainer}>
        <Carousel
          showIndicators={true}
          showNavigation={feedbacks.length > 1}
        >
          {feedbacks.map((feedback, index) => renderFeedbackCard(feedback, index))}
        </Carousel>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
    width: '100%',
    maxWidth: MAX_CARD_WIDTH + 40,
    alignItems: 'center',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: MAX_CARD_WIDTH + 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
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
    marginTop: 16,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    minHeight: 500,
    padding: 24,
    marginHorizontal: 20,
    elevation: 4,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: CARD_WIDTH,
    width: CARD_WIDTH,
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  feedbackCardCritical: {
    borderWidth: 2,
    borderColor: '#E53935',
    backgroundColor: '#fff5f5',
    marginHorizontal: 18, // Reduzir margem para compensar a borda de 2px
  },
  feedbackCardPositive: {
    borderWidth: 2,
    borderColor: '#2E7D32', // Verde escuro para positivo
    backgroundColor: '#f1f8f4', // Verde muito claro para fundo
    marginHorizontal: 18, // Reduzir margem para compensar a borda de 2px
  },
  feedbackHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedbackIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedbackTitleContainer: {
    flex: 1,
    flexShrink: 1,
  },
  feedbackDiscipline: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  feedbackDisciplineCritical: {
    color: '#E53935',
  },
  feedbackDisciplinePositive: {
    color: '#2E7D32', // Verde escuro para positivo
    fontWeight: '700',
  },
  feedbackDate: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  feedbackContent: {
    flex: 1,
    minHeight: 0,
  },
  feedbackContentContainer: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  feedbackTitleCritical: {
    color: '#E53935',
  },
  feedbackTitlePositive: {
    color: '#2E7D32', // Verde escuro para positivo
    fontWeight: '700',
  },
  feedbackDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  feedbackDescriptionCritical: {
    color: '#C62828',
    fontWeight: '500',
  },
  feedbackDescriptionPositive: {
    color: '#1B5E20', // Verde muito escuro para texto positivo
    fontWeight: '500',
  },
  featuresContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  featuresContainerCritical: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    borderTopWidth: 0,
    marginTop: 8,
  },
  featuresContainerPositive: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    borderTopWidth: 0,
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  featuresTitleCritical: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 15,
  },
  featuresTitlePositive: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  featureName: {
    fontWeight: '600',
  },
  featureValue: {
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  suggestionItem: {
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary || '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  feedbackProfessor: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  feedbackProfessorCritical: {
    color: '#E53935',
  },
  feedbackProfessorPositive: {
    color: '#2E7D32', // Verde escuro para positivo
    fontWeight: '600',
  },
});

