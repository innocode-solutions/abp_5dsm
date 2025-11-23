import React, { useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { PredictionService, EngagementData, PredictionResponse } from '../service/PredictionService';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { Feather } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Engagement'>;

const EngagementScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para controlar o modo de entrada (classificação ou valor) de cada campo numérico
  const [raisedhandsMode, setRaisedhandsMode] = useState<'classification' | 'value'>('classification');
  const [visitedResourcesMode, setVisitedResourcesMode] = useState<'classification' | 'value'>('classification');
  const [announcementsViewMode, setAnnouncementsViewMode] = useState<'classification' | 'value'>('classification');
  const [discussionMode, setDiscussionMode] = useState<'classification' | 'value'>('classification');
  
  // Estados para valores de classificação
  const [raisedhandsClassification, setRaisedhandsClassification] = useState('');
  const [visitedResourcesClassification, setVisitedResourcesClassification] = useState('');
  const [announcementsViewClassification, setAnnouncementsViewClassification] = useState('');
  const [discussionClassification, setDiscussionClassification] = useState('');
  
  // Obter matrícula selecionada dos parâmetros da rota
  const selectedMatriculaId = (route.params as any)?.selectedMatriculaId;
  const selectedDisciplina = (route.params as any)?.selectedDisciplina;

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
      // Validar se temos uma matrícula selecionada ANTES de calcular
      if (!selectedMatriculaId) {
        Alert.alert("Atenção", "Por favor, selecione uma matéria antes de calcular o risco de evasão.");
        setLoading(false);
        return;
      }
      
      const result = await PredictionService.predictDropout(selectedMatriculaId, engagementData);
      
      // Pequeno delay para garantir que o loading seja visível
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navegar para a tela de resultados
      navigation.navigate("PredictionResult", { 
        predictionResult: {
          prediction: {
            tipoPredicao: 'EVASAO',
            probabilidade: result.data.Probabilidade,
            classificacao: result.data.Classificacao,
            explicacao: result.data.Explicacao,
          },
          data: result.data
        }
      });
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao processar predição.';
      setErrorMessage(errorMsg);
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const renderRadio = (value: string, onChange: (v: string) => void, options: { label: string; value: string }[]) => (
    <View style={styles.radioGroup}>
      {options.map((opt) => (
        <TouchableOpacity key={opt.value} style={[styles.radioOption, value === opt.value && styles.radioOptionSelected]} onPress={() => onChange(opt.value)}>
          <Text style={[styles.radioText, value === opt.value && styles.radioTextSelected]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Componente para campos numéricos com opção de classificação ou valor
  const renderFieldWithOptions = (
    label: string,
    description: string,
    value: string,
    setValue: (v: string) => void,
    classificationValue: string,
    setClassificationValue: (v: string) => void,
    mode: 'classification' | 'value',
    setMode: (m: 'classification' | 'value') => void,
    options: Array<{ label: string; value: string; numeric?: number }>,
    placeholder: string
  ) => {
    // Se estiver em modo classificação e houver valor selecionado, converter para numérico
    const numericValue = mode === 'classification' && classificationValue 
      ? options.find(opt => opt.value === classificationValue)?.numeric?.toString() || ''
      : value;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        
        {/* Toggle entre Classificação e Valor */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'classification' && styles.modeButtonActive]}
            onPress={() => {
              setMode('classification');
              // Se houver valor numérico, tentar encontrar classificação correspondente
              if (value && !classificationValue) {
                const num = Number(value);
                const closest = options.reduce((prev, curr) => {
                  const prevDiff = Math.abs((prev.numeric || 0) - num);
                  const currDiff = Math.abs((curr.numeric || 0) - num);
                  return currDiff < prevDiff ? curr : prev;
                });
                setClassificationValue(closest.value);
                setValue(closest.numeric?.toString() || '');
              }
            }}
          >
            <Feather name="list" size={16} color={mode === 'classification' ? '#fff' : colors.muted || '#666'} />
            <Text style={[styles.modeButtonText, mode === 'classification' && styles.modeButtonTextActive]}>Classificação</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'value' && styles.modeButtonActive]}
            onPress={() => {
              setMode('value');
              // Se houver classificação selecionada, manter o valor numérico
              if (classificationValue && !value) {
                const selected = options.find(opt => opt.value === classificationValue);
                if (selected?.numeric) {
                  setValue(selected.numeric.toString());
                }
              }
            }}
          >
            <Feather name="hash" size={16} color={mode === 'value' ? '#fff' : colors.muted || '#666'} />
            <Text style={[styles.modeButtonText, mode === 'value' && styles.modeButtonTextActive]}>Valor</Text>
          </TouchableOpacity>
        </View>

        {/* Renderizar baseado no modo */}
        {mode === 'classification' ? (
          <View style={styles.pickerContainer}>
            {!classificationValue && <Text style={styles.pickerPlaceholder}>{placeholder}</Text>}
            <View style={styles.pickerOptions}>
              {options.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.pickerOption, classificationValue === item.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setClassificationValue(item.value);
                    setValue(item.numeric?.toString() || '');
                  }}
                >
                  <Text style={[styles.pickerOptionText, classificationValue === item.value && styles.pickerOptionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              // Limpar classificação quando o usuário digita manualmente
              if (classificationValue) {
                setClassificationValue('');
              }
            }}
            placeholder={placeholder}
          />
        )}
      </View>
    );
  };

  // Opções de classificação para cada campo numérico (valores ajustados para serem mais realistas)
  const PARTICIPATION_OPTIONS = [
    { label: 'Muito Baixa (0-5)', value: 'very_low', numeric: 3 },
    { label: 'Baixa (6-15)', value: 'low', numeric: 10 },
    { label: 'Média (16-30)', value: 'medium', numeric: 23 },
    { label: 'Alta (31-50)', value: 'high', numeric: 40 },
    { label: 'Muito Alta (51+)', value: 'very_high', numeric: 60 },
  ];

  const RESOURCES_OPTIONS = [
    { label: 'Muito Poucos (0-5)', value: 'very_low', numeric: 3 },
    { label: 'Poucos (6-15)', value: 'low', numeric: 10 },
    { label: 'Médio (16-30)', value: 'medium', numeric: 23 },
    { label: 'Muitos (31-50)', value: 'high', numeric: 40 },
    { label: 'Muitíssimos (51+)', value: 'very_high', numeric: 60 },
  ];

  const ANNOUNCEMENTS_OPTIONS = [
    { label: 'Muito Poucos (0-5)', value: 'very_low', numeric: 3 },
    { label: 'Poucos (6-15)', value: 'low', numeric: 10 },
    { label: 'Médio (16-30)', value: 'medium', numeric: 23 },
    { label: 'Muitos (31-50)', value: 'high', numeric: 40 },
    { label: 'Muitíssimos (51+)', value: 'very_high', numeric: 60 },
  ];

  const DISCUSSION_OPTIONS = [
    { label: 'Muito Poucas (0-5)', value: 'very_low', numeric: 3 },
    { label: 'Poucas (6-15)', value: 'low', numeric: 10 },
    { label: 'Médias (16-30)', value: 'medium', numeric: 23 },
    { label: 'Muitas (31-50)', value: 'high', numeric: 40 },
    { label: 'Muitíssimas (51+)', value: 'very_high', numeric: 60 },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Predição de Evasão</Text>
        <Text style={styles.subtitle}>
          {selectedDisciplina 
            ? `Matéria: ${selectedDisciplina}\nInforme seus dados de engajamento para receber uma predição do risco de evasão`
            : 'Informe seus dados de engajamento para receber uma predição do risco de evasão'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participação</Text>
          <Text style={styles.sectionSubtitle}>Informe sua participação nas atividades escolares</Text>

          {renderFieldWithOptions(
            'Participação em Aula:',
            'Quantas vezes você levantou a mão ou participou ativamente nas aulas (fazendo perguntas, respondendo, etc.)',
            raisedhands,
            setRaisedhands,
            raisedhandsClassification,
            setRaisedhandsClassification,
            raisedhandsMode,
            setRaisedhandsMode,
            PARTICIPATION_OPTIONS,
            'Selecione ou digite o valor'
          )}

          {renderFieldWithOptions(
            'Materiais Acessados:',
            'Quantos materiais de estudo você acessou (vídeos, textos, exercícios, etc.) na plataforma ou sistema da escola',
            visitedResources,
            setVisitedResources,
            visitedResourcesClassification,
            setVisitedResourcesClassification,
            visitedResourcesMode,
            setVisitedResourcesMode,
            RESOURCES_OPTIONS,
            'Selecione ou digite o valor'
          )}

          {renderFieldWithOptions(
            'Avisos e Comunicados Visualizados:',
            'Quantos avisos, comunicados ou anúncios da escola você leu ou visualizou',
            announcementsView,
            setAnnouncementsView,
            announcementsViewClassification,
            setAnnouncementsViewClassification,
            announcementsViewMode,
            setAnnouncementsViewMode,
            ANNOUNCEMENTS_OPTIONS,
            'Selecione ou digite o valor'
          )}

          {renderFieldWithOptions(
            'Participações em Discussões:',
            'Quantas vezes você participou de discussões, fóruns ou debates online ou presenciais',
            discussion,
            setDiscussion,
            discussionClassification,
            setDiscussionClassification,
            discussionMode,
            setDiscussionMode,
            DISCUSSION_OPTIONS,
            'Selecione ou digite o valor'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Família e Frequência</Text>
          <Text style={styles.sectionSubtitle}>Informações sobre envolvimento familiar e frequência</Text>

          <Text style={styles.label}>Pais Responderam Pesquisa da Escola:</Text>
          <Text style={styles.description}>Se seus pais ou responsáveis responderam pesquisas ou questionários enviados pela escola</Text>
          {renderRadio(parentAnsweringSurvey, (v) => setParentAnsweringSurvey(v as 'Yes' | 'No'), [{ label: "Sim", value: "Yes" }, { label: "Não", value: "No" }])}

          <Text style={styles.label}>Satisfação dos Pais com a Escola:</Text>
          <Text style={styles.description}>Como seus pais avaliam a escola (Boa = satisfeitos, Ruim = insatisfeitos)</Text>
          {renderRadio(parentschoolSatisfaction, (v) => setParentschoolSatisfaction(v as 'Good' | 'Bad'), [{ label: "Boa", value: "Good" }, { label: "Ruim", value: "Bad" }])}

          <Text style={styles.label}>Faltas Escolares:</Text>
          <Text style={styles.description}>Quantas faltas você teve no período (Menos de 7 = poucas faltas, 7 ou mais = muitas faltas)</Text>
          {renderRadio(studentAbsenceDays, (v) => setStudentAbsenceDays(v as 'Under-7' | 'Above-7'), [{ label: "Menos de 7 faltas", value: "Under-7" }, { label: "7 faltas ou mais", value: "Above-7" }])}
        </View>

        {validationError && <Text style={styles.errorText}>{validationError}</Text>}
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Calcular Risco de Evasão</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingTop: 0 },
  header: { padding: 20, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 10, textAlign: 'center' },
  scrollContainer: { paddingBottom: 100, paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: colors.text, marginTop: 8 },
  sectionSubtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 12 },
  description: { fontSize: 13, color: colors.muted, marginBottom: 8, fontStyle: 'italic' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  radioGroup: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  radioOption: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center' },
  radioOptionSelected: { borderColor: colors.primary, backgroundColor: '#E3F2FD' },
  radioText: { fontSize: 16, color: colors.text },
  radioTextSelected: { color: colors.primary, fontWeight: '600' },
  fieldContainer: { marginBottom: 16 },
  modeToggle: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  modeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 6, gap: 6 },
  modeButtonActive: { backgroundColor: colors.primary },
  modeButtonText: { fontSize: 14, color: colors.muted || '#666', fontWeight: '600' },
  modeButtonTextActive: { color: '#fff' },
  pickerContainer: { marginBottom: 8 },
  pickerPlaceholder: { fontSize: 14, color: colors.muted || '#999', marginBottom: 8 },
  pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  pickerOption: { flex: 1, minWidth: '30%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center', margin: 4 },
  pickerOptionSelected: { borderColor: colors.primary, backgroundColor: '#E3F2FD' },
  pickerOptionText: { fontSize: 14, color: colors.text },
  pickerOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#E53935', fontSize: 14, marginTop: 8, marginBottom: 8 },
  resultContainer: { marginTop: 24, marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  resultHeader: { marginBottom: 24, alignItems: 'center' },
  // Card principal de evasão - estilo similar ao de desempenho
  evasionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  evasionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  evasionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  evasionValueContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  evasionValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  evasionValueLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  evasionBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  evasionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  evasionInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  evasionInfoLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  evasionInfoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  riskLabel: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  riskProbability: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  infoCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  infoLabel: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  infoValue: { fontSize: 16, color: colors.text },
  feedbackContainer: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 12, borderLeftWidth: 4 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  feedbackTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: 8 },
  feedbackMessage: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 12 },
  featuresContainer: { marginTop: 12, marginBottom: 12 },
  featuresTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { fontSize: 14, color: colors.text, marginLeft: 8, flex: 1 },
  featureName: { fontWeight: '600' },
  featureValue: { fontWeight: '500' },
  suggestionsContainer: { marginTop: 12, backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  suggestionItem: { marginBottom: 4 },
  suggestionText: { fontSize: 14, color: colors.text, lineHeight: 20 },
});

export default EngagementScreen;
