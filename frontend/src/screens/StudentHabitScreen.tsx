import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { HabitService } from "../service/HabitService";
import { PredictionService } from "../service/PredictionService";
import { useHabit } from "../context/HabitContext";
import { useAuth } from "../context/AuthContext";
import colors from "../theme/colors";
import { generatePerformanceFeedback } from "../service/FeedbackService";
import { Feather } from "@expo/vector-icons";

export interface HabitData {
  sono: number;
  horasEstudo: number;
  motivacao: number;
  frequencia: number;
  Previous_Scores?: number;
  Distance_from_Home?: string;
  Gender?: string;
  Parental_Education_Level?: string;
  Parental_Involvement?: string;
  School_Type?: string;
  Peer_Influence?: string;
  Extracurricular_Activities?: string;
  Learning_Disabilities?: string;
  Internet_Access?: string;
  Access_to_Resources?: string;
  Teacher_Quality?: string;
  Family_Income?: string;
  Motivation_Level?: string;
  Tutoring_Sessions?: string;
  Physical_Activity?: string;
  IDHabito?: string;
  IDAluno?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PICKER_OPTIONS = {
  distance: [{ label: "Perto", value: "Near" }, { label: "Longe", value: "Far" }],
  gender: [{ label: "Masculino", value: "Male" }, { label: "Feminino", value: "Female" }],
  education: [
    { label: "Nenhum", value: "None" },
    { label: "Ensino Médio", value: "High School" },
    { label: "Algum Ensino Superior", value: "Some College" },
    { label: "Bacharelado", value: "Bachelor's" },
    { label: "Mestrado", value: "Master's" },
  ],
  level: [{ label: "Baixo", value: "Low" }, { label: "Médio", value: "Medium" }, { label: "Alto", value: "High" }],
  school: [{ label: "Pública", value: "Public" }, { label: "Privada", value: "Private" }],
  peer: [{ label: "Positiva", value: "Positive" }, { label: "Negativa", value: "Negative" }, { label: "Neutra", value: "Neutral" }],
  yesNo: [{ label: "Sim", value: "Yes" }, { label: "Não", value: "No" }],
  resources: [{ label: "Ruim", value: "Poor" }, { label: "Médio", value: "Average" }, { label: "Bom", value: "Good" }],
};

const HabitScreen: React.FC = () => {
  const { submitHabits, loading } = useHabit();
  const { user } = useAuth();

  const [horasEstudo, setHorasEstudo] = useState("");
  const [horasSono, setHorasSono] = useState("");
  const [motivacao, setMotivacao] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [previousScores, setPreviousScores] = useState("");
  const [distanceFromHome, setDistanceFromHome] = useState("");
  const [gender, setGender] = useState("");
  const [parentalEducationLevel, setParentalEducationLevel] = useState("");
  const [parentalInvolvement, setParentalInvolvement] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [peerInfluence, setPeerInfluence] = useState("");
  const [extracurricularActivities, setExtracurricularActivities] = useState("");
  const [learningDisabilities, setLearningDisabilities] = useState("");
  const [internetAccess, setInternetAccess] = useState("");
  const [accessToResources, setAccessToResources] = useState("");
  const [teacherQuality, setTeacherQuality] = useState("");
  const [familyIncome, setFamilyIncome] = useState("");
  const [tutoringSessions, setTutoringSessions] = useState("");
  const [physicalActivity, setPhysicalActivity] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<'basic' | 'additional'>('basic');

  const loadHabits = async () => {
    if (!user?.IDUser) return;
    try {
      const data: HabitData = await HabitService.getHabits();
      if (data) {
        setHorasEstudo(data.horasEstudo?.toString() || "");
        setHorasSono(data.sono?.toString() || "");
        setMotivacao(data.motivacao?.toString() || "");
        setFrequencia(data.frequencia?.toString() || "");
        setPreviousScores(data.Previous_Scores?.toString() || "");
        setDistanceFromHome(data.Distance_from_Home || "");
        setGender(data.Gender || "");
        setParentalEducationLevel(data.Parental_Education_Level || "");
        setParentalInvolvement(data.Parental_Involvement || "");
        setSchoolType(data.School_Type || "");
        setPeerInfluence(data.Peer_Influence || "");
        setExtracurricularActivities(data.Extracurricular_Activities || "");
        setLearningDisabilities(data.Learning_Disabilities || "");
        setInternetAccess(data.Internet_Access || "");
        setAccessToResources(data.Access_to_Resources || "");
        setTeacherQuality(data.Teacher_Quality || "");
        setFamilyIncome(data.Family_Income || "");
        setTutoringSessions(data.Tutoring_Sessions || "");
        setPhysicalActivity(data.Physical_Activity || "");
      }
    } catch (err: any) {
      console.log("Erro ao carregar hábitos:", err.message || err);
    }
  };

  useEffect(() => { loadHabits().catch(console.error); }, [user]);

  const validateBasic = (): boolean => {
    setValidationError(null); // Limpa erros anteriores
    const num = (v: string, min: number, max: number) => {
      if (!v || v.trim() === '') return true; // Campo vazio
      const n = Number(v);
      return isNaN(n) || n < min || n > max; // Fora do range
    };
    if (num(horasEstudo, 0, 84)) { setValidationError("Horas de estudo semanais devem estar entre 0 e 84 (máximo ~12h por dia)."); return false; }
    if (num(horasSono, 0, 12)) { setValidationError("Horas de sono devem estar entre 0 e 12."); return false; }
    if (num(motivacao, 0, 10)) { setValidationError("Motivação deve estar entre 0 e 10."); return false; }
    if (num(frequencia, 0, 100)) { setValidationError("Frequência deve estar entre 0 e 100%."); return false; }
    setValidationError(null); // Limpa erro se tudo estiver ok
    return true;
  };

  const validateAll = (): boolean => {
    if (!validateBasic()) return false;
    const required = [
      { v: previousScores, n: "Notas Anteriores" },
      { v: distanceFromHome, n: "Distância de Casa" },
      { v: gender, n: "Gênero" },
      { v: parentalEducationLevel, n: "Nível Educacional dos Pais" },
      { v: parentalInvolvement, n: "Envolvimento dos Pais" },
      { v: schoolType, n: "Tipo de Escola" },
      { v: peerInfluence, n: "Influência dos Colegas" },
      { v: extracurricularActivities, n: "Atividades Extracurriculares" },
      { v: learningDisabilities, n: "Deficiências de Aprendizagem" },
      { v: internetAccess, n: "Acesso à Internet" },
      { v: accessToResources, n: "Acesso a Recursos" },
      { v: teacherQuality, n: "Qualidade do Professor" },
      { v: familyIncome, n: "Renda Familiar" },
      { v: tutoringSessions, n: "Sessões de Tutoria" },
      { v: physicalActivity, n: "Atividade Física" },
    ];
    const missing = required.filter(f => !f.v).map(f => f.n);
    if (missing.length) { setValidationError(`Campos obrigatórios: ${missing.join(", ")}`); return false; }
    if (Number(previousScores) < 0 || Number(previousScores) > 100) { setValidationError("Notas anteriores devem estar entre 0 e 100."); return false; }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.IDUser) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    if (!validateBasic()) return;
    try {
      setValidationError(null);
      await submitHabits({ 
        horasEstudo: Number(horasEstudo), 
        sono: Number(horasSono), 
        motivacao: Number(motivacao), 
        frequencia: Number(frequencia) 
      });
      setSuccessMessage("Hábitos básicos salvos com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erro ao enviar hábitos.";
      setValidationError(errorMsg);
      Alert.alert("Erro", errorMsg);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.IDUser) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    if (!validateAll()) return;
    try {
      setValidationError(null);
      await submitHabits({
        horasEstudo: Number(horasEstudo), 
        sono: Number(horasSono), 
        motivacao: Number(motivacao), 
        frequencia: Number(frequencia),
        Previous_Scores: Number(previousScores), 
        Distance_from_Home: distanceFromHome, 
        Gender: gender,
        Parental_Education_Level: parentalEducationLevel, 
        Parental_Involvement: parentalInvolvement, 
        School_Type: schoolType,
        Peer_Influence: peerInfluence, 
        Extracurricular_Activities: extracurricularActivities, 
        Learning_Disabilities: learningDisabilities,
        Internet_Access: internetAccess, 
        Access_to_Resources: accessToResources, 
        Teacher_Quality: teacherQuality,
        Family_Income: familyIncome, 
        Tutoring_Sessions: tutoringSessions, 
        Physical_Activity: physicalActivity,
      } as any);
      setSuccessMessage("Todos os dados foram salvos com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erro ao salvar dados.";
      setValidationError(errorMsg);
      Alert.alert("Erro", errorMsg);
    }
  };

  const handlePredictPerformance = async () => {
    if (!user?.IDUser) {
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    if (!validateAll()) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos para obter uma predição precisa.");
      return;
    }
    setPredictionLoading(true);
    setPredictionError(null);
    setPredictionResult(null);
    setValidationError(null);
    try {
      const result = await PredictionService.predictPerformance({
        horasEstudo: Number(horasEstudo), 
        sono: Number(horasSono), 
        motivacao: Number(motivacao), 
        frequencia: Number(frequencia),
        Previous_Scores: Number(previousScores), 
        Distance_from_Home: distanceFromHome, 
        Gender: gender,
        Parental_Education_Level: parentalEducationLevel, 
        Parental_Involvement: parentalInvolvement, 
        School_Type: schoolType,
        Peer_Influence: peerInfluence, 
        Extracurricular_Activities: extracurricularActivities, 
        Learning_Disabilities: learningDisabilities,
        Internet_Access: internetAccess, 
        Access_to_Resources: accessToResources, 
        Teacher_Quality: teacherQuality,
        Family_Income: familyIncome, 
        Tutoring_Sessions: tutoringSessions, 
        Physical_Activity: physicalActivity,
      });
      setPredictionResult(result);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erro ao gerar predição de desempenho.";
      setPredictionError(errorMsg);
      Alert.alert("Erro", errorMsg);
    } finally {
      setPredictionLoading(false);
    }
  };

  const renderPicker = (value: string, onChange: (v: string) => void, options: typeof PICKER_OPTIONS.distance, placeholder: string) => (
    <View style={styles.pickerContainer}>
      {!value && <Text style={styles.pickerPlaceholder}>{placeholder}</Text>}
      <View style={styles.pickerOptions}>
        {options.map((item) => (
          <TouchableOpacity key={item.value} style={[styles.pickerOption, value === item.value && styles.pickerOptionSelected]} onPress={() => onChange(item.value)}>
            <Text style={[styles.pickerOptionText, value === item.value && styles.pickerOptionTextSelected]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hábitos de Estudo e Dados Pessoais</Text>
        <Text style={styles.subtitle}>Preencha todos os campos para obter predições mais precisas</Text>

        <View style={styles.sectionTabs}>
          <TouchableOpacity style={[styles.tab, currentSection === 'basic' && styles.tabActive]} onPress={() => setCurrentSection('basic')}>
            <Text style={[styles.tabText, currentSection === 'basic' && styles.tabTextActive]}>Campos Básicos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, currentSection === 'additional' && styles.tabActive]} onPress={() => setCurrentSection('additional')}>
            <Text style={[styles.tabText, currentSection === 'additional' && styles.tabTextActive]}>Dados Adicionais</Text>
          </TouchableOpacity>
        </View>

        {currentSection === 'basic' && (
          <View>
            <Text style={styles.sectionTitle}>Hábitos Básicos</Text>
            <Text style={styles.label}>Horas de Estudo Semanais:</Text>
            <Text style={styles.description}>Quantas horas você estuda por semana? (Ex: 35 horas = ~5h por dia)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={horasEstudo} onChangeText={setHorasEstudo} placeholder="Ex: 35" />
            <Text style={styles.label}>Horas de Sono (0-12):</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={horasSono} onChangeText={setHorasSono} placeholder="Ex: 8" />
            <Text style={styles.label}>Nível de Motivação (0-10):</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={motivacao} onChangeText={setMotivacao} placeholder="Ex: 7" />
            <Text style={styles.label}>Frequência às Aulas (%):</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={frequencia} onChangeText={setFrequencia} placeholder="Ex: 85" />
            <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar Hábitos Básicos</Text>}
            </TouchableOpacity>
          </View>
        )}

        {currentSection === 'additional' && (
          <View>
            <Text style={styles.sectionTitle}>Dados Adicionais para Predição</Text>
            <Text style={styles.label}>Notas Anteriores (0-100):</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={previousScores} onChangeText={setPreviousScores} placeholder="Ex: 80" />
            <Text style={styles.label}>Distância de Casa:</Text>
            {renderPicker(distanceFromHome, setDistanceFromHome, PICKER_OPTIONS.distance, "Selecione a distância")}
            <Text style={styles.label}>Gênero:</Text>
            {renderPicker(gender, setGender, PICKER_OPTIONS.gender, "Selecione o gênero")}
            <Text style={styles.label}>Nível Educacional dos Pais:</Text>
            {renderPicker(parentalEducationLevel, setParentalEducationLevel, PICKER_OPTIONS.education, "Selecione o nível educacional")}
            <Text style={styles.label}>Envolvimento dos Pais:</Text>
            {renderPicker(parentalInvolvement, setParentalInvolvement, PICKER_OPTIONS.level, "Selecione o nível de envolvimento")}
            <Text style={styles.label}>Tipo de Escola:</Text>
            {renderPicker(schoolType, setSchoolType, PICKER_OPTIONS.school, "Selecione o tipo de escola")}
            <Text style={styles.label}>Influência dos Colegas:</Text>
            <Text style={styles.description}>Como seus colegas de classe influenciam seu comportamento e desempenho escolar.</Text>
            {renderPicker(peerInfluence, setPeerInfluence, PICKER_OPTIONS.peer, "Selecione a influência")}
            <Text style={styles.label}>Atividades Extracurriculares:</Text>
            {renderPicker(extracurricularActivities, setExtracurricularActivities, PICKER_OPTIONS.yesNo, "Selecione")}
            <Text style={styles.label}>Deficiências de Aprendizagem:</Text>
            {renderPicker(learningDisabilities, setLearningDisabilities, PICKER_OPTIONS.yesNo, "Selecione")}
            <Text style={styles.label}>Acesso à Internet:</Text>
            {renderPicker(internetAccess, setInternetAccess, PICKER_OPTIONS.yesNo, "Selecione")}
            <Text style={styles.label}>Acesso a Recursos:</Text>
            {renderPicker(accessToResources, setAccessToResources, PICKER_OPTIONS.resources, "Selecione o acesso")}
            <Text style={styles.label}>Qualidade do Professor:</Text>
            {renderPicker(teacherQuality, setTeacherQuality, PICKER_OPTIONS.resources, "Selecione a qualidade")}
            <Text style={styles.label}>Renda Familiar:</Text>
            {renderPicker(familyIncome, setFamilyIncome, PICKER_OPTIONS.level, "Selecione a renda")}
            <Text style={styles.label}>Sessões de Tutoria:</Text>
            {renderPicker(tutoringSessions, setTutoringSessions, PICKER_OPTIONS.yesNo, "Selecione")}
            <Text style={styles.label}>Atividade Física:</Text>
            {renderPicker(physicalActivity, setPhysicalActivity, PICKER_OPTIONS.level, "Selecione o nível")}
            <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSaveAll} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar Todos os Dados</Text>}
            </TouchableOpacity>
          </View>
        )}

        {validationError && <Text style={styles.errorText}>{validationError}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

        <TouchableOpacity style={[styles.predictButton, (predictionLoading || loading) && { opacity: 0.6 }]} onPress={handlePredictPerformance} disabled={predictionLoading || loading}>
          {predictionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Prever Desempenho</Text>}
        </TouchableOpacity>

        {predictionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Erro ao processar predição</Text>
            <Text style={styles.errorText}>{predictionError}</Text>
          </View>
        )}

        {predictionResult?.success && (() => {
          const cat = getCategoryInfo(predictionResult.prediction?.classificacao || '');
          return (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Resultado da Predição</Text>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Nota Prevista</Text>
                <Text style={styles.scoreValue}>{(predictionResult.prediction?.notaPrevista || 0).toFixed(1)}</Text>
              </View>
              <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: cat.color }]}>
                <Text style={styles.infoLabel}>Classificação:</Text>
                <Text style={[styles.infoValue, { color: cat.color, fontWeight: 'bold' }]}>{cat.label}</Text>
                {cat.description ? <Text style={[styles.description, { marginTop: 8 }]}>{cat.description}</Text> : null}
                {cat.showTips && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Dicas para melhorar:</Text>
                    <Text style={styles.description}>• Aumente suas horas de estudo</Text>
                    <Text style={styles.description}>• Melhore sua frequência nas aulas</Text>
                    <Text style={styles.description}>• Participe mais ativamente das aulas</Text>
                    <Text style={styles.description}>• Peça ajuda aos professores quando necessário</Text>
                    <Text style={styles.description}>• Considere fazer reforço escolar</Text>
                  </View>
                )}
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Confiança:</Text>
                <Text style={styles.infoValue}>{predictionResult.prediction?.probabilidade || 0}%</Text>
              </View>
              {(() => {
                const feedback = generatePerformanceFeedback(
                  predictionResult.prediction?.explicacao || '',
                  predictionResult.prediction?.notaPrevista,
                  predictionResult.prediction?.classificacao
                );
                
                return (
                  <View style={styles.feedbackContainer}>
                    <View style={styles.feedbackHeader}>
                      <Feather name="info" size={20} color={colors.primary || "#4A90E2"} />
                      <Text style={styles.feedbackTitle}>{feedback.title}</Text>
                    </View>
                    <Text style={styles.feedbackMessage}>{feedback.message}</Text>
                    
                    {feedback.features.length > 0 && (
                      <View style={styles.featuresContainer}>
                        <Text style={styles.featuresTitle}>Principais fatores:</Text>
                        {feedback.features.map((feature, idx) => (
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
                    
                    {feedback.suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>💡 Sugestões para melhorar:</Text>
                        {feedback.suggestions.map((suggestion, idx) => (
                          <View key={idx} style={styles.suggestionItem}>
                            <Text style={styles.suggestionText}>• {suggestion}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg || "#f5f5f5" },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.text || "#333" },
  subtitle: { fontSize: 14, color: colors.muted || "#666", marginBottom: 20, textAlign: "center" },
  sectionTabs: { flexDirection: "row", marginBottom: 20, backgroundColor: "#fff", borderRadius: 8, padding: 4 },
  tab: { flex: 1, padding: 12, borderRadius: 6, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary || "#4A90E2" },
  tabText: { fontSize: 14, color: colors.text || "#333", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: colors.text || "#333" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 15, marginBottom: 5, color: colors.text || "#333" },
  description: { fontSize: 13, color: colors.muted || "#666", marginBottom: 8, fontStyle: "italic" },
  input: { height: 40, borderColor: "#ccc", borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, backgroundColor: "#fff", marginBottom: 8 },
  pickerContainer: { marginBottom: 8 },
  pickerPlaceholder: { fontSize: 14, color: colors.muted || "#999", marginBottom: 8 },
  pickerOptions: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  pickerOption: { flex: 1, minWidth: "30%", backgroundColor: "#fff", borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, alignItems: "center", margin: 4 },
  pickerOptionSelected: { borderColor: colors.primary || "#4A90E2", backgroundColor: "#E3F2FD" },
  pickerOptionText: { fontSize: 14, color: colors.text || "#333" },
  pickerOptionTextSelected: { color: colors.primary || "#4A90E2", fontWeight: "600" },
  button: { backgroundColor: colors.primary || "#4A90E2", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  predictButton: { backgroundColor: "#28a745", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 12 },
  errorText: { color: "red", marginTop: 10, textAlign: "center" },
  successText: { color: "green", marginTop: 10, textAlign: "center", fontWeight: "bold" },
  errorContainer: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#E53935", borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 12 },
  errorTitle: { color: "#E53935", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  resultContainer: { marginTop: 20, marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: colors.text || "#333" },
  scoreCard: { backgroundColor: colors.primary || "#4A90E2", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  scoreLabel: { fontSize: 16, color: "#fff", marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: "bold", color: "#fff" },
  infoCard: { backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  infoLabel: { fontSize: 14, color: colors.muted || "#666", marginBottom: 4 },
  infoValue: { fontSize: 16, color: colors.text || "#333" },
  feedbackContainer: { backgroundColor: "#E3F2FD", borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.primary || "#4A90E2" },
  feedbackHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  feedbackTitle: { fontSize: 18, fontWeight: "700", color: colors.text || "#333", marginLeft: 8 },
  feedbackMessage: { fontSize: 15, color: colors.text || "#333", lineHeight: 22, marginBottom: 12 },
  featuresContainer: { marginTop: 12, marginBottom: 12 },
  featuresTitle: { fontSize: 14, fontWeight: "600", color: colors.text || "#333", marginBottom: 8 },
  featureItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  featureText: { fontSize: 14, color: colors.text || "#333", marginLeft: 8, flex: 1 },
  featureName: { fontWeight: "600" },
  featureValue: { fontWeight: "500" },
  suggestionsContainer: { marginTop: 12, backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  suggestionsTitle: { fontSize: 14, fontWeight: "600", color: colors.text || "#333", marginBottom: 8 },
  suggestionItem: { marginBottom: 4 },
  suggestionText: { fontSize: 14, color: colors.text || "#333", lineHeight: 20 },
});

export default HabitScreen;
