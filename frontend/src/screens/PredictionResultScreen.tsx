import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import colors from "../theme/colors";
import { RootStackParamList } from "../navigation";
import { generatePerformanceFeedback, generateDropoutFeedback } from "../service/FeedbackService";

type Props = NativeStackScreenProps<RootStackParamList, "PredictionResult">;

export default function PredictionResultScreen({ route, navigation }: Props) {
  const { predictionResult } = route.params;

  // Detectar tipo de predição
  const isEvasion = predictionResult?.prediction?.tipoPredicao === 'EVASAO' || 
                    predictionResult?.data?.TipoPredicao === 'EVASAO';

  const getCategoryInfo = (classificacao: string) => {
    const map: Record<string, { label: string; description: string; color: string; showTips: boolean }> = {
      'INSUFICIENTE': { label: 'Abaixo do Esperado', description: 'Sua nota está abaixo de 60 pontos. Isso significa que você precisa melhorar em algumas áreas. Não desanime! Use essa informação para focar nos pontos que precisam de mais atenção.', color: '#F44336', showTips: true },
      'REGULAR': { label: 'Regular', description: 'Desempenho regular. Você está entre 60 e 69 pontos. Continue se esforçando!', color: '#FF9800', showTips: false },
      'BOM': { label: 'Bom', description: 'Desempenho bom! Você está entre 70 e 79 pontos.', color: '#FFC107', showTips: false },
      'MUITO BOM': { label: 'Muito Bom', description: 'Desempenho muito bom! Você está entre 80 e 89 pontos.', color: '#8BC34A', showTips: false },
      'EXCELENTE': { label: 'Excelente', description: 'Desempenho excepcional! Você está acima de 90 pontos.', color: '#4CAF50', showTips: false },
    };
    return map[classificacao] || { label: classificacao, description: '', color: '#666', showTips: false };
  };

  const getRiskColor = (p: number) => p >= 0.7 ? '#E53935' : p >= 0.4 ? '#FF9800' : '#4CAF50';
  const getRiskLabel = (p: number) => p >= 0.7 ? 'Alto Risco' : p >= 0.4 ? 'Médio Risco' : 'Baixo Risco';

  // Dados para desempenho
  const cat = getCategoryInfo(predictionResult?.prediction?.classificacao || '');
  const notaPrevista = predictionResult?.prediction?.notaPrevista || 0;
  const predictedScore = predictionResult?.prediction?.predicted_score || (notaPrevista * 10);
  const isNotaBaixa = predictedScore < 60;
  const isAprovado = predictedScore >= 60;
  
  // Dados para evasão
  const probabilidade = predictionResult?.prediction?.probabilidade || 
                         predictionResult?.data?.Probabilidade || 0;
  const riskColor = getRiskColor(probabilidade);
  const riskPercentage = (probabilidade * 100).toFixed(1);
  const isHighRisk = probabilidade >= 0.7;
  const isMediumRisk = probabilidade >= 0.4 && probabilidade < 0.7;
  const isLowRisk = probabilidade < 0.4;
  
  // Gerar feedback baseado no tipo
  const feedback = isEvasion 
    ? generateDropoutFeedback(
        predictionResult?.prediction?.explicacao || 
        predictionResult?.data?.Explicacao || '',
        probabilidade,
        predictionResult?.prediction?.classificacao || 
        predictionResult?.data?.Classificacao || ''
      )
    : generatePerformanceFeedback(
        predictionResult?.prediction?.explicacao || '',
        notaPrevista,
        predictionResult?.prediction?.classificacao || ''
      );

  const handleRefazer = () => {
    navigation.goBack();
  };

  const handleVoltarHome = () => {
    navigation.navigate("StudentDashboard");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultado da Predição</Text>
          <Text style={styles.subtitle}>
            {isEvasion ? 'Análise do risco de evasão' : 'Análise do seu desempenho acadêmico'}
          </Text>
        </View>

        {isEvasion ? (
          // Card de evasão
          <View style={[
            styles.scoreCard,
            { backgroundColor: riskColor, borderLeftWidth: 4, borderLeftColor: riskColor }
          ]}>
            <View style={styles.evasionCardHeader}>
              <Feather 
                name={isLowRisk ? "check-circle" : (isHighRisk ? "alert-triangle" : "info")} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.scoreLabel}>Risco de Evasão</Text>
            </View>
            <Text style={styles.scoreValue}>{riskPercentage}%</Text>
            <Text style={styles.scoreLabel}>de probabilidade</Text>
            {isLowRisk && (
              <View style={styles.evasionBadge}>
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={styles.evasionBadgeText}>Baixo Risco - Continue assim!</Text>
              </View>
            )}
            {isHighRisk && (
              <View style={styles.evasionBadge}>
                <Feather name="alert-triangle" size={16} color="#fff" />
                <Text style={styles.evasionBadgeText}>Atenção: Risco alto de evasão</Text>
              </View>
            )}
            {(predictionResult?.prediction?.classificacao || predictionResult?.data?.Classificacao) && !isLowRisk && !isHighRisk && (
              <View style={styles.evasionBadge}>
                <Text style={styles.evasionBadgeText}>
                  {predictionResult?.prediction?.classificacao || predictionResult?.data?.Classificacao}
                </Text>
              </View>
            )}
            {!predictionResult?.prediction?.classificacao && !predictionResult?.data?.Classificacao && !isLowRisk && !isHighRisk && (
              <View style={styles.evasionInfo}>
                <Text style={styles.evasionInfoLabel}>Nível de Risco:</Text>
                <Text style={styles.evasionInfoValue}>{getRiskLabel(probabilidade)}</Text>
              </View>
            )}
          </View>
        ) : (
          // Card de desempenho
          <View style={[
            styles.scoreCard,
            isNotaBaixa && styles.scoreCardCritical,
            isAprovado && styles.scoreCardPositive
          ]}>
            <Text style={styles.scoreLabel}>Nota Prevista</Text>
            <Text style={[
              styles.scoreValue,
              isNotaBaixa && styles.scoreValueCritical,
              isAprovado && styles.scoreValuePositive
            ]}>
              {notaPrevista.toFixed(1)}
            </Text>
            {isNotaBaixa && (
              <View style={styles.criticalBadge}>
                <Feather name="alert-triangle" size={16} color="#fff" />
                <Text style={styles.criticalBadgeText}>Atenção: Nota abaixo do esperado</Text>
              </View>
            )}
            {isAprovado && (
              <View style={styles.approvedBadge}>
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={styles.approvedBadgeText}>Parabéns! Você está aprovado!</Text>
              </View>
            )}
          </View>
        )}

        {!isEvasion && (
          <View style={[
            styles.infoCard,
            { borderLeftWidth: 4, borderLeftColor: isNotaBaixa ? '#F44336' : cat.color }
          ]}>
            <Text style={styles.infoLabel}>Classificação:</Text>
            <Text style={[
              styles.infoValue,
              { color: isNotaBaixa ? '#F44336' : cat.color, fontWeight: 'bold' }
            ]}>
              {cat.label}
            </Text>
            {cat.description ? <Text style={[styles.description, { marginTop: 8 }]}>{cat.description}</Text> : null}
          </View>
        )}

        {isEvasion && (predictionResult?.prediction?.classificacao || predictionResult?.data?.Classificacao) && (
          <View style={[
            styles.infoCard,
            { borderLeftWidth: 4, borderLeftColor: riskColor }
          ]}>
            <Text style={styles.infoLabel}>Classificação:</Text>
            <Text style={[
              styles.infoValue,
              { color: riskColor, fontWeight: 'bold' }
            ]}>
              {predictionResult?.prediction?.classificacao || predictionResult?.data?.Classificacao}
            </Text>
          </View>
        )}

        {!isEvasion && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Confiança:</Text>
            <Text style={styles.infoValue}>{predictionResult?.prediction?.probabilidade || 0}%</Text>
          </View>
        )}

        <View style={[
          styles.feedbackContainer,
          isEvasion && { 
            borderLeftColor: riskColor,
            backgroundColor: isLowRisk ? '#E8F5E9' : (isHighRisk ? '#FFEBEE' : '#FFF3E0')
          },
          !isEvasion && isNotaBaixa && styles.feedbackContainerCritical,
          !isEvasion && isAprovado && styles.feedbackContainerPositive
        ]}>
          <View style={styles.feedbackHeader}>
            <Feather 
              name={
                isEvasion 
                  ? (isHighRisk ? "alert-triangle" : (isLowRisk ? "check-circle" : "info"))
                  : (isNotaBaixa ? "alert-triangle" : (isAprovado ? "check-circle" : "info"))
              } 
              size={20} 
              color={
                isEvasion 
                  ? riskColor
                  : (isNotaBaixa ? "#F44336" : (isAprovado ? "#2E7D32" : (colors.primary || "#4A90E2")))
              } 
            />
            <Text 
              style={[
                styles.feedbackTitle,
                isEvasion && { color: riskColor },
                !isEvasion && isNotaBaixa && styles.feedbackTitleCritical,
                !isEvasion && isAprovado && styles.feedbackTitlePositive
              ]}
              numberOfLines={0}
            >
              {feedback.title}
            </Text>
          </View>
          <Text 
            style={[
              styles.feedbackMessage,
              isEvasion && isLowRisk && { color: '#1B5E20', fontWeight: '500' },
              isEvasion && isHighRisk && { color: '#D32F2F', fontWeight: '500' },
              !isEvasion && isNotaBaixa && styles.feedbackMessageCritical
            ]}
            numberOfLines={0}
          >
            {feedback.message}
          </Text>

          {feedback.features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Principais fatores:</Text>
              {feedback.features
                .filter((feature) => {
                  // Filtrar envolvimento dos pais - não deve aparecer como principal fator
                  const featureName = feature.feature.toLowerCase();
                  return !featureName.includes('envolvimento') && 
                         !featureName.includes('pais') && 
                         !featureName.includes('parent') &&
                         !featureName.includes('familia');
                })
                .map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Feather
                      name={feature.influence === 'positiva' ? 'arrow-up-circle' : 'arrow-down-circle'}
                      size={16}
                      color={feature.influence === 'positiva' ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={styles.featureText}>
                      <Text style={styles.featureName}>{feature.feature}</Text>
                      {': '}
                      <Text style={[
                        styles.featureValue,
                        { color: feature.influence === 'positiva' ? '#4CAF50' : '#F44336' }
                      ]}>
                        {feature.value} ({feature.influence})
                      </Text>
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {(feedback.suggestions.length > 0 || (!isEvasion && isNotaBaixa)) && (
            <View style={[
              styles.suggestionsContainer,
              isEvasion && isHighRisk && { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: riskColor },
              isEvasion && isLowRisk && { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: riskColor },
              !isEvasion && isNotaBaixa && styles.suggestionsContainerCritical
            ]}>
              <Text style={[
                styles.suggestionsTitle,
                isEvasion && isHighRisk && { color: riskColor, fontWeight: '700' },
                isEvasion && isLowRisk && { color: riskColor, fontWeight: '700' },
                !isEvasion && isNotaBaixa && styles.suggestionsTitleCritical
              ]}>
                {isEvasion 
                  ? (isHighRisk ? '🚨 Ações Urgentes para Reduzir o Risco:' : '💡 Sugestões para manter o baixo risco:')
                  : (isNotaBaixa ? '🚨 Ações Urgentes para Melhorar:' : '💡 Sugestões para melhorar:')
                }
              </Text>
              {feedback.suggestions.length > 0 ? (
                feedback.suggestions.map((suggestion, idx) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text 
                      style={[
                        styles.suggestionText,
                        isEvasion && isLowRisk && { color: '#1B5E20', fontWeight: '500' },
                        isEvasion && isHighRisk && { color: '#D32F2F', fontWeight: '500' },
                        !isEvasion && isNotaBaixa && styles.suggestionTextCritical
                      ]}
                      numberOfLines={0}
                    >
                      • {suggestion}
                    </Text>
                  </View>
                ))
              ) : (!isEvasion && isNotaBaixa) ? (
                // Sugestões padrão quando nota < 6 e não há sugestões específicas
                [
                  'Aumente suas horas de estudo diárias para pelo menos 3-4 horas',
                  'Compareça a TODAS as aulas - frequência é fundamental',
                  'Organize um cronograma de estudos e siga rigorosamente',
                  'Busque ajuda dos professores e monitores imediatamente',
                  'Participe de grupos de estudo e atividades complementares',
                  'Revise o conteúdo das aulas no mesmo dia',
                  'Faça exercícios práticos regularmente',
                  'Mantenha uma rotina de sono adequada (7-8 horas por noite)'
                ].map((suggestion, idx) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text 
                      style={[
                        styles.suggestionText,
                        styles.suggestionTextCritical
                      ]}
                      numberOfLines={0}
                    >
                      • {suggestion}
                    </Text>
                  </View>
                ))
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.refazerButton]} onPress={handleRefazer}>
            <Feather name="refresh-cw" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Refazer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.homeButton]} onPress={handleVoltarHome}>
            <Feather name="home" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Voltar para Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg || "#f5f5f5", paddingTop: 0 },
  scrollContent: { paddingBottom: 40, paddingTop: 10 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.text || "#333" },
  subtitle: { fontSize: 14, color: colors.muted || "#666", marginBottom: 10, textAlign: "center" },
  scoreCard: { backgroundColor: colors.primary || "#4A90E2", borderRadius: 12, padding: 24, alignItems: "center", marginHorizontal: 20, marginTop: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  evasionCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  evasionBadge: { flexDirection: "row", alignItems: "center", alignSelf: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12, backgroundColor: "rgba(0,0,0,0.2)" },
  evasionBadgeText: { color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 6 },
  evasionInfo: { alignItems: "center", marginTop: 12 },
  evasionInfoLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  evasionInfoValue: { fontSize: 16, fontWeight: "600", color: "#fff" },
  scoreCardCritical: { backgroundColor: "#F44336", borderWidth: 2, borderColor: "#D32F2F" },
  scoreCardPositive: { backgroundColor: "#2E7D32", borderWidth: 2, borderColor: "#1B5E20" },
  scoreLabel: { fontSize: 16, color: "#fff", marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: "bold", color: "#fff" },
  scoreValueCritical: { color: "#fff" },
  scoreValuePositive: { color: "#fff" },
  criticalBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  criticalBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 6 },
  approvedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  approvedBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 6 },
  infoCard: { backgroundColor: "#fff", borderRadius: 8, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  infoLabel: { fontSize: 14, color: colors.muted || "#666", marginBottom: 4 },
  infoValue: { fontSize: 16, color: colors.text || "#333" },
  description: { fontSize: 13, color: colors.muted || "#666", fontStyle: "italic" },
  feedbackContainer: { 
    backgroundColor: "#E3F2FD", 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 20, 
    marginTop: 12, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: colors.primary || "#4A90E2", 
    flexWrap: "wrap",
    overflow: 'hidden', // Garantir que o conteúdo não saia do card
  },
  feedbackContainerCritical: { backgroundColor: "#FFEBEE", borderLeftColor: "#F44336", borderLeftWidth: 4 },
  feedbackContainerPositive: { backgroundColor: "#E8F5E9", borderLeftColor: "#2E7D32", borderLeftWidth: 4 },
  feedbackHeader: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginBottom: 12, 
    flexWrap: "wrap",
    width: '100%', // Garantir largura total
  },
  feedbackTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: colors.text || "#333", 
    marginLeft: 8, 
    flex: 1, 
    flexShrink: 1, 
    flexWrap: "wrap",
    minWidth: 0, // IMPORTANTE: Permite que o texto quebre corretamente em flexbox
  },
  feedbackTitleCritical: { color: "#F44336" },
  feedbackTitlePositive: { color: "#2E7D32" },
  feedbackMessage: { 
    fontSize: 15, 
    color: colors.text || "#333", 
    lineHeight: 22, 
    marginBottom: 12, 
    flexWrap: "wrap",
    width: '100%', // Garantir largura total
  },
  feedbackMessageCritical: { color: "#D32F2F", fontWeight: "500" },
  featuresContainer: { marginTop: 12, marginBottom: 12 },
  featuresTitle: { fontSize: 14, fontWeight: "600", color: colors.text || "#333", marginBottom: 8, flexWrap: "wrap" },
  featureItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap" },
  featureText: { 
    fontSize: 14, 
    color: colors.text || "#333", 
    marginLeft: 8, 
    flex: 1, 
    flexShrink: 1, 
    flexWrap: "wrap",
    minWidth: 0, // IMPORTANTE: Permite quebra de texto
  },
  featureName: { fontWeight: "600" },
  featureValue: { fontWeight: "500" },
  suggestionsContainer: { 
    marginTop: 12, 
    backgroundColor: "#fff", 
    borderRadius: 8, 
    padding: 12, 
    flexWrap: "wrap",
    overflow: 'hidden', // Garantir que o conteúdo não saia do card
    width: '100%', // Garantir largura total
  },
  suggestionsContainerCritical: { 
    backgroundColor: "#FFEBEE", 
    borderWidth: 1, 
    borderColor: "#F44336" 
  },
  suggestionsTitle: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: colors.text || "#333", 
    marginBottom: 8, 
    flexWrap: "wrap",
    width: '100%', // Garantir largura total
  },
  suggestionsTitleCritical: { 
    color: "#F44336", 
    fontWeight: "700" 
  },
  suggestionItem: { 
    marginBottom: 4, 
    flexWrap: "wrap",
    width: '100%', // Garantir largura total
  },
  suggestionText: { 
    fontSize: 14, 
    color: colors.text || "#333", 
    lineHeight: 20, 
    flexWrap: "wrap", 
    flexShrink: 1,
    width: '100%', // Garantir largura total
    minWidth: 0, // IMPORTANTE: Permite quebra de texto
  },
  suggestionTextCritical: { 
    color: "#D32F2F", 
    fontWeight: "500" 
  },
  actionsContainer: { marginHorizontal: 20, marginTop: 20, gap: 12 },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 8, gap: 8 },
  refazerButton: { backgroundColor: colors.primary || "#4A90E2" },
  homeButton: { backgroundColor: "#28a745" },
  actionButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

