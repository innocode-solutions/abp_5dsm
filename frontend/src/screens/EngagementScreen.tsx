import React, { useState } from 'react';
import { Alert, ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { PredictionService, EngagementData, PredictionResponse } from '../service/PredictionService';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Engagement'>;

const EngagementScreen: React.FC<Props> = () => {
  const { user } = useAuth();
  const [raisedhands, setRaisedhands] = useState('');
  const [visitedResources, setVisitedResources] = useState('');
  const [announcementsView, setAnnouncementsView] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [parentAnsweringSurvey, setParentAnsweringSurvey] = useState<'Yes' | 'No' | ''>('');
  const [parentschoolSatisfaction, setParentschoolSatisfaction] = useState<'Good' | 'Bad' | ''>('');
  const [studentAbsenceDays, setStudentAbsenceDays] = useState<'Under-7' | 'Above-7' | ''>('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    setValidationError(null);
    const num = (v: string) => !v || isNaN(parseInt(v)) || parseInt(v) < 0;
    if (num(raisedhands)) { setValidationError('Participação em aula deve ser um número positivo.'); return false; }
    if (num(visitedResources)) { setValidationError('Materiais acessados deve ser um número positivo.'); return false; }
    if (num(announcementsView)) { setValidationError('Avisos visualizados deve ser um número positivo.'); return false; }
    if (num(discussion)) { setValidationError('Participações em discussões deve ser um número positivo.'); return false; }
    if (!parentAnsweringSurvey) { setValidationError('Por favor, informe se os pais responderam a pesquisa.'); return false; }
    if (!parentschoolSatisfaction) { setValidationError('Por favor, informe a satisfação dos pais com a escola.'); return false; }
    if (!studentAbsenceDays) { setValidationError('Por favor, informe a faixa de faltas.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMessage(null);
    setPredictionResult(null);
    try {
      const engagementData: EngagementData = {
        raisedhands: parseInt(raisedhands),
        VisITedResources: parseInt(visitedResources),
        AnnouncementsView: parseInt(announcementsView),
        Discussion: parseInt(discussion),
        ParentAnsweringSurvey: parentAnsweringSurvey as 'Yes' | 'No',
        ParentschoolSatisfaction: parentschoolSatisfaction as 'Good' | 'Bad',
        StudentAbsenceDays: studentAbsenceDays as 'Under-7' | 'Above-7',
      };
      const result = await PredictionService.predictDropout('', engagementData);
      setPredictionResult(result);
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao processar predição.';
      setErrorMessage(errorMsg);
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (p: number) => p >= 0.7 ? '#E53935' : p >= 0.4 ? '#FF9800' : '#4CAF50';
  const getRiskLabel = (p: number) => p >= 0.7 ? 'Alto Risco' : p >= 0.4 ? 'Médio Risco' : 'Baixo Risco';

  const renderRadio = (value: string, onChange: (v: string) => void, options: { label: string; value: string }[]) => (
    <View style={styles.radioGroup}>
      {options.map((opt) => (
        <TouchableOpacity key={opt.value} style={[styles.radioOption, value === opt.value && styles.radioOptionSelected]} onPress={() => onChange(opt.value)}>
          <Text style={[styles.radioText, value === opt.value && styles.radioTextSelected]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Predição de Evasão</Text>
        <Text style={styles.subtitle}>Informe seus dados de engajamento para receber uma predição do risco de evasão</Text>

        <Text style={styles.label}>Participação em Aula:</Text>
        <Text style={styles.description}>Quantas vezes você levantou a mão ou participou ativamente nas aulas (fazendo perguntas, respondendo, etc.)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={raisedhands} onChangeText={setRaisedhands} placeholder="Ex: 15" />

        <Text style={styles.label}>Materiais de Estudo Acessados:</Text>
        <Text style={styles.description}>Quantos materiais de estudo você acessou (vídeos, textos, exercícios, etc.) na plataforma ou sistema da escola</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={visitedResources} onChangeText={setVisitedResources} placeholder="Ex: 20" />

        <Text style={styles.label}>Avisos e Comunicados Visualizados:</Text>
        <Text style={styles.description}>Quantos avisos, comunicados ou anúncios da escola você leu ou visualizou</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={announcementsView} onChangeText={setAnnouncementsView} placeholder="Ex: 10" />

        <Text style={styles.label}>Participações em Discussões:</Text>
        <Text style={styles.description}>Quantas vezes você participou de discussões, fóruns ou debates online ou presenciais</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={discussion} onChangeText={setDiscussion} placeholder="Ex: 8" />

        <Text style={styles.label}>Pais Responderam Pesquisa da Escola:</Text>
        <Text style={styles.description}>Se seus pais ou responsáveis responderam pesquisas ou questionários enviados pela escola</Text>
        {renderRadio(parentAnsweringSurvey, (v) => setParentAnsweringSurvey(v as 'Yes' | 'No'), [{ label: "Sim", value: "Yes" }, { label: "Não", value: "No" }])}

        <Text style={styles.label}>Satisfação dos Pais com a Escola:</Text>
        <Text style={styles.description}>Como seus pais avaliam a escola (Boa = satisfeitos, Ruim = insatisfeitos)</Text>
        {renderRadio(parentschoolSatisfaction, (v) => setParentschoolSatisfaction(v as 'Good' | 'Bad'), [{ label: "Boa", value: "Good" }, { label: "Ruim", value: "Bad" }])}

        <Text style={styles.label}>Faltas Escolares:</Text>
        <Text style={styles.description}>Quantas faltas você teve no período (Menos de 7 = poucas faltas, 7 ou mais = muitas faltas)</Text>
        {renderRadio(studentAbsenceDays, (v) => setStudentAbsenceDays(v as 'Under-7' | 'Above-7'), [{ label: "Menos de 7 faltas", value: "Under-7" }, { label: "7 faltas ou mais", value: "Above-7" }])}

        {validationError && <Text style={styles.errorText}>{validationError}</Text>}
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {predictionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Resultado da Predição</Text>
            <View style={[styles.riskCard, { backgroundColor: getRiskColor(predictionResult.data.Probabilidade) }]}>
              <Text style={styles.riskLabel}>{getRiskLabel(predictionResult.data.Probabilidade)}</Text>
              <Text style={styles.riskProbability}>{(predictionResult.data.Probabilidade * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Classificação:</Text>
              <Text style={styles.infoValue}>{predictionResult.data.Classificacao}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Explicação:</Text>
              <Text style={styles.infoValue}>{predictionResult.data.Explicacao}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Calcular Risco de Evasão</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 12 },
  description: { fontSize: 13, color: colors.muted, marginBottom: 8, fontStyle: 'italic' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  radioGroup: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  radioOption: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center' },
  radioOptionSelected: { borderColor: colors.primary, backgroundColor: '#E3F2FD' },
  radioText: { fontSize: 16, color: colors.text },
  radioTextSelected: { color: colors.primary, fontWeight: '600' },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#E53935', fontSize: 14, marginTop: 8, marginBottom: 8 },
  resultContainer: { marginTop: 24, marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  riskCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  riskLabel: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  riskProbability: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  infoCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  infoLabel: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  infoValue: { fontSize: 16, color: colors.text },
});

export default EngagementScreen;
