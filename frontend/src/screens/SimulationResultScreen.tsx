import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import Card from '../components/Card';
import Section from '../components/Section';
import ScoreCard from '../components/ScoreCard';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation';

type SimulationResultRouteProp = RouteProp<RootStackParamList, 'SimulationResult'>;
type SimulationResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SimulationResult'>;

export default function SimulationResultScreen() {
  const navigation = useNavigation<SimulationResultNavigationProp>();
  const route = useRoute<SimulationResultRouteProp>();
  const { 
    predicted_score, 
    approval_status, 
    grade_category, 
    disciplina, 
    periodo,
    Explicacao,
  } = route.params;

  const handleRefazerSimulacao = () => {
    // Navegar de volta para a tela anterior ou para a tela de simulação
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resultado da Simulação</Text>
          <Text style={styles.headerSubtitle}>
            {disciplina.NomeDaDisciplina}
          </Text>
          {disciplina.CodigoDaDisciplina && (
            <Text style={styles.headerCode}>
              {disciplina.CodigoDaDisciplina} - {periodo.Nome}
            </Text>
          )}
        </View>

        <Card style={styles.scoreCardContainer}>
          <ScoreCard 
            score={predicted_score} 
            category={grade_category}
            showLabel={true}
          />
        </Card>

        <Section title="Informações da Predição">
          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue,
                { color: predicted_score >= 60 ? colors.success : colors.error }
              ]}>
                {approval_status}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoria:</Text>
              <Text style={styles.infoValue}>{grade_category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Período:</Text>
              <Text style={styles.infoValue}>{periodo.Nome}</Text>
            </View>
          </Card>
        </Section>

        {Explicacao && (
          <Section title="Explicação">
            <Card>
              <Text style={styles.explanationText}>{Explicacao}</Text>
            </Card>
          </Section>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.refazerButton}
            onPress={handleRefazerSimulacao}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.refazerButtonText}>Refazer Simulação</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerCode: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
  },
  scoreCardContainer: {
    marginBottom: 24,
    paddingVertical: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'justify',
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  refazerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  refazerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

