import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { HabitService } from "../service/HabitService";
import { PredictionService } from "../service/PredictionService";
import { useHabit } from "../context/HabitContext";
import { useAuth } from "../context/AuthContext";
import colors from "../theme/colors";
import { RootStackParamList } from "../navigation";
import { Feather } from "@expo/vector-icons";
import { getStudentIdByUserId, getStudentDetails } from "../service/studentService";
import { 
  saveMatriculasToCache, 
  getMatriculasFromCache, 
  clearMatriculasCache,
  CachedMatricula 
} from "../service/matriculaCacheService";

type Props = NativeStackScreenProps<RootStackParamList, "Habits">;

export interface HabitData {
  sono: number;
  horasEstudo: number;
  motivacao: number;
  frequencia: number;
  // Previous_Scores removido para evitar viés - não é mais necessário
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
  // Classificações para campos numéricos
  horasEstudo: [
    { label: "Muito Baixo (0-10h)", value: "5", numeric: 5 },
    { label: "Baixo (11-20h)", value: "15", numeric: 15 },
    { label: "Médio (21-35h)", value: "28", numeric: 28 },
    { label: "Alto (36-50h)", value: "43", numeric: 43 },
    { label: "Muito Alto (51-84h)", value: "67", numeric: 67 },
  ],
  horasSono: [
    { label: "Muito Pouco (0-4h)", value: "2", numeric: 2 },
    { label: "Pouco (5-6h)", value: "5.5", numeric: 5.5 },
    { label: "Adequado (7-8h)", value: "7.5", numeric: 7.5 },
    { label: "Bom (9-10h)", value: "9.5", numeric: 9.5 },
    { label: "Muito (11-12h)", value: "11.5", numeric: 11.5 },
  ],
  motivacao: [
    { label: "Muito Baixa (0-2)", value: "1", numeric: 1 },
    { label: "Baixa (3-4)", value: "3.5", numeric: 3.5 },
    { label: "Média (5-6)", value: "5.5", numeric: 5.5 },
    { label: "Alta (7-8)", value: "7.5", numeric: 7.5 },
    { label: "Muito Alta (9-10)", value: "9.5", numeric: 9.5 },
  ],
  frequencia: [
    { label: "Muito Baixa (0-40%)", value: "20", numeric: 20 },
    { label: "Baixa (41-60%)", value: "50", numeric: 50 },
    { label: "Média (61-80%)", value: "70", numeric: 70 },
    { label: "Alta (81-95%)", value: "88", numeric: 88 },
    { label: "Muito Alta (96-100%)", value: "98", numeric: 98 },
  ],
  notasAnteriores: [
    { label: "Insuficiente (0-59)", value: "45", numeric: 45 },
    { label: "Regular (60-69)", value: "65", numeric: 65 },
    { label: "Bom (70-79)", value: "75", numeric: 75 },
    { label: "Muito Bom (80-89)", value: "85", numeric: 85 },
    { label: "Excelente (90-100)", value: "95", numeric: 95 },
  ],
};

const HabitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { submitHabits, loading } = useHabit();
  const { user } = useAuth();
  
  // Receber matéria selecionada da tela anterior (opcional)
  const initialMatriculaId = route.params?.selectedMatriculaId;
  const initialDisciplina = route.params?.selectedDisciplina;
  
  // Estados para seleção de matéria
  const [matriculas, setMatriculas] = useState<CachedMatricula[]>([]);
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<string | undefined>(initialMatriculaId);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | undefined>(initialDisciplina);
  const [loadingMatriculas, setLoadingMatriculas] = useState(false);
  const [matriculasLoaded, setMatriculasLoaded] = useState(false);
  
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const [horasEstudo, setHorasEstudo] = useState("");
  const [horasSono, setHorasSono] = useState("");
  const [motivacao, setMotivacao] = useState("");
  const [frequencia, setFrequencia] = useState("");
  // Previous_Scores removido para evitar viés - não é mais necessário
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
  
  // Estado para última predição de desempenho
  
  // Estados para controlar o modo de entrada (classificação ou valor) de cada campo
  const [horasEstudoMode, setHorasEstudoMode] = useState<'classification' | 'value'>('classification');
  const [horasSonoMode, setHorasSonoMode] = useState<'classification' | 'value'>('classification');
  const [motivacaoMode, setMotivacaoMode] = useState<'classification' | 'value'>('classification');
  const [frequenciaMode, setFrequenciaMode] = useState<'classification' | 'value'>('classification');
  // Previous_Scores removido para evitar viés - não é mais necessário
  
  // Estados para valores de classificação
  const [horasEstudoClassification, setHorasEstudoClassification] = useState("");
  const [horasSonoClassification, setHorasSonoClassification] = useState("");
  const [motivacaoClassification, setMotivacaoClassification] = useState("");
  const [frequenciaClassification, setFrequenciaClassification] = useState("");
  // Previous_Scores removido para evitar viés - não é mais necessário

  // Função auxiliar para encontrar a classificação mais próxima de um valor numérico
  const findClosestClassification = (value: number, options: Array<{ value: string; numeric?: number }>) => {
    if (!value && value !== 0) return null;
    return options.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.numeric || 0) - value);
      const currDiff = Math.abs((curr.numeric || 0) - value);
      return currDiff < prevDiff ? curr : prev;
    });
  };

  // Função para obter cor da categoria
  const getCategoryColor = (classificacao: string): string => {
    const upper = classificacao.toUpperCase();
    if (upper.includes('EXCELENTE') || upper.includes('MUITO BOM')) return '#4CAF50';
    if (upper.includes('BOM')) return '#8BC34A';
    if (upper.includes('REGULAR')) return '#FFC107';
    if (upper.includes('INSUFICIENTE') || upper.includes('REPROVADO')) return '#F44336';
    return colors.primary || '#4A90E2';
  };

  const loadHabits = async () => {
    if (!user?.IDUser) return;
    try {
      const data = await HabitService.getHabits() as HabitData;
      if (data) {
        // Carregar campos básicos e restaurar classificações
        if (data.horasEstudo !== undefined && data.horasEstudo !== null) {
          const horasEstudoStr = data.horasEstudo.toString();
          setHorasEstudo(horasEstudoStr);
          const closest = findClosestClassification(data.horasEstudo, PICKER_OPTIONS.horasEstudo);
          if (closest) {
            setHorasEstudoClassification(closest.value);
            setHorasEstudoMode('classification');
          }
        }
        
        if (data.sono !== undefined && data.sono !== null) {
          const horasSonoStr = data.sono.toString();
          setHorasSono(horasSonoStr);
          const closest = findClosestClassification(data.sono, PICKER_OPTIONS.horasSono);
          if (closest) {
            setHorasSonoClassification(closest.value);
            setHorasSonoMode('classification');
          }
        }
        
        if (data.motivacao !== undefined && data.motivacao !== null) {
          const motivacaoStr = data.motivacao.toString();
          setMotivacao(motivacaoStr);
          const closest = findClosestClassification(data.motivacao, PICKER_OPTIONS.motivacao);
          if (closest) {
            setMotivacaoClassification(closest.value);
            setMotivacaoMode('classification');
          }
        }
        
        if (data.frequencia !== undefined && data.frequencia !== null) {
          const frequenciaStr = data.frequencia.toString();
          setFrequencia(frequenciaStr);
          const closest = findClosestClassification(data.frequencia, PICKER_OPTIONS.frequencia);
          if (closest) {
            setFrequenciaClassification(closest.value);
            setFrequenciaMode('classification');
          }
        }
        
        // Previous_Scores removido para evitar viés - não é mais necessário
        
        // IMPORTANTE: NÃO ativar o toggle automaticamente ao carregar dados
        // O toggle só deve ser ativado quando o usuário clicar explicitamente
        // Limpar todos os campos adicionais primeiro
        setDistanceFromHome("");
        setGender("");
        setParentalEducationLevel("");
        setParentalInvolvement("");
        setSchoolType("");
        setPeerInfluence("");
        setExtracurricularActivities("");
        setLearningDisabilities("");
        setInternetAccess("");
        setAccessToResources("");
        setTeacherQuality("");
        setFamilyIncome("");
        setTutoringSessions("");
        setPhysicalActivity("");
        
        // Carregar valores dos campos adicionais (mas manter o toggle DESATIVADO)
        // Os valores ficam disponíveis caso o usuário ative o toggle depois
        if (data.Distance_from_Home && data.Distance_from_Home.trim() !== '') {
          setDistanceFromHome(data.Distance_from_Home);
        }
        if (data.Gender && data.Gender.trim() !== '') {
          setGender(data.Gender);
        }
        if (data.Parental_Education_Level && data.Parental_Education_Level.trim() !== '') {
          setParentalEducationLevel(data.Parental_Education_Level);
        }
        if (data.Parental_Involvement && data.Parental_Involvement.trim() !== '') {
          setParentalInvolvement(data.Parental_Involvement);
        }
        if (data.School_Type && data.School_Type.trim() !== '') {
          setSchoolType(data.School_Type);
        }
        if (data.Peer_Influence && data.Peer_Influence.trim() !== '') {
          setPeerInfluence(data.Peer_Influence);
        }
        if (data.Extracurricular_Activities && data.Extracurricular_Activities.trim() !== '') {
          setExtracurricularActivities(data.Extracurricular_Activities);
        }
        if (data.Learning_Disabilities && data.Learning_Disabilities.trim() !== '') {
          setLearningDisabilities(data.Learning_Disabilities);
        }
        if (data.Internet_Access && data.Internet_Access.trim() !== '') {
          setInternetAccess(data.Internet_Access);
        }
        if (data.Access_to_Resources && data.Access_to_Resources.trim() !== '') {
          setAccessToResources(data.Access_to_Resources);
        }
        if (data.Teacher_Quality && data.Teacher_Quality.trim() !== '') {
          setTeacherQuality(data.Teacher_Quality);
        }
        if (data.Family_Income && data.Family_Income.trim() !== '') {
          setFamilyIncome(data.Family_Income);
        }
        if (data.Tutoring_Sessions && data.Tutoring_Sessions.trim() !== '') {
          setTutoringSessions(data.Tutoring_Sessions);
        }
        if (data.Physical_Activity && data.Physical_Activity.trim() !== '') {
          setPhysicalActivity(data.Physical_Activity);
        }
        
        // IMPORTANTE: NÃO ativar o toggle automaticamente
        // O toggle deve permanecer DESATIVADO até que o usuário clique nele
        setShowAdditionalFields(false);
      }
    } catch (err: any) {
    }
  };

  useEffect(() => { 
    loadHabits().catch(console.error);
    loadMatriculas().catch(console.error);
  }, [user]);
  
  // Carregar matrículas disponíveis (com cache)
  const loadMatriculas = async (forceRefresh: boolean = false) => {
    if (!user?.IDUser) return;
    
    try {
      setLoadingMatriculas(true);
      const studentId = await getStudentIdByUserId();
      if (!studentId) return;
      
      // Tentar buscar do cache primeiro (se não for refresh forçado)
      if (!forceRefresh && !matriculasLoaded) {
        const cachedMatriculas = await getMatriculasFromCache(studentId);
        if (cachedMatriculas && cachedMatriculas.length > 0) {
          setMatriculas(cachedMatriculas);
          setMatriculasLoaded(true);
          
          // Selecionar matrícula se necessário
          if (!selectedMatriculaId && cachedMatriculas.length > 0) {
            setSelectedMatriculaId(cachedMatriculas[0].IDMatricula);
            setSelectedDisciplina(cachedMatriculas[0].disciplina.NomeDaDisciplina);
          }
          
          setLoadingMatriculas(false);
          return; // Usar cache, não fazer requisição
        }
      }
      
      // Se não há cache ou é refresh forçado, buscar da API
      const studentData = await getStudentDetails(studentId);
      
      // Filtrar apenas matrículas ativas
      const matriculasAtivas: CachedMatricula[] = studentData.matriculas
        .filter(m => !m.Status || m.Status === 'ENROLLED')
        .map(m => ({
          IDMatricula: m.IDMatricula,
          disciplina: m.disciplina,
          periodo: m.periodo
        }));
      
      // Salvar no cache
      await saveMatriculasToCache(studentId, matriculasAtivas);
      
      setMatriculas(matriculasAtivas);
      setMatriculasLoaded(true);
      
      // Se não temos matrícula selecionada inicialmente e há matrículas, selecionar a primeira
      if (!initialMatriculaId && matriculasAtivas.length > 0) {
        setSelectedMatriculaId(matriculasAtivas[0].IDMatricula);
        setSelectedDisciplina(matriculasAtivas[0].disciplina.NomeDaDisciplina);
      } else if (initialMatriculaId) {
        // Se temos matrícula inicial, garantir que ela está na lista
        const matriculaInicial = matriculasAtivas.find(m => m.IDMatricula === initialMatriculaId);
        if (matriculaInicial) {
          setSelectedMatriculaId(initialMatriculaId);
          setSelectedDisciplina(initialDisciplina || matriculaInicial.disciplina.NomeDaDisciplina);
        } else if (matriculasAtivas.length > 0) {
          // Se a matrícula inicial não está mais disponível, usar a primeira
          setSelectedMatriculaId(matriculasAtivas[0].IDMatricula);
          setSelectedDisciplina(matriculasAtivas[0].disciplina.NomeDaDisciplina);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
      // Em caso de erro, tentar usar cache mesmo que expirado
      const cachedMatriculas = await getMatriculasFromCache(await getStudentIdByUserId() || '');
      if (cachedMatriculas) {
        setMatriculas(cachedMatriculas);
      }
    } finally {
      setLoadingMatriculas(false);
    }
  };
  
  // Função para carregar a última predição de desempenho

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadHabits().catch(console.error);
      // Só recarregar matrículas se ainda não foram carregadas (usa cache se disponível)
      if (!matriculasLoaded) {
        loadMatriculas().catch(console.error);
      }
    }, [user, matriculasLoaded])
  );
  

  const validateBasic = (): boolean => {
    setValidationError(null); // Limpa erros anteriores
    const num = (v: string, min: number, max: number) => {
      if (!v || v.trim() === '') return false; // Campo vazio é válido (usará valor padrão)
      const n = Number(v);
      return isNaN(n) || n < min || n > max; // Fora do range
    };
    if (num(horasEstudo, 0, 84)) { setValidationError("Horas de estudo semanais devem estar entre 0 e 84 (máximo ~12h por dia)."); return false; }
    if (num(horasSono, 0, 12)) { setValidationError("Horas de sono devem estar entre 0 e 12."); return false; }
    if (num(motivacao, 0, 10)) { setValidationError("Motivação deve estar entre 0 e 10."); return false; }
    if (num(frequencia, 0, 100)) { setValidationError("Frequência deve estar entre 0 e 100%."); return false; }
    // Previous_Scores removido para evitar viés - não é mais necessário
    setValidationError(null); // Limpa erro se tudo estiver ok
    return true;
  };

  const validateAll = (): boolean => {
    if (!validateBasic()) return false;
    const required = [
      // Previous_Scores removido para evitar viés - não é mais necessário
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
    // Previous_Scores removido - não é mais necessário
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
      // Criar objeto limpo APENAS com campos básicos
      // Previous_Scores removido para evitar viés - não é mais necessário
      // Não incluir nenhum campo adicional para garantir independência
      const basicData: HabitData = {
        horasEstudo: Number(horasEstudo), 
        sono: Number(horasSono), 
        motivacao: Number(motivacao), 
        frequencia: Number(frequencia),
        // Explicitamente NÃO incluir campos adicionais
      };
      
      await submitHabits(basicData);
      
      // Limpar campos adicionais após salvar básico para manter independência
      setDistanceFromHome("");
      setGender("");
      setParentalEducationLevel("");
      setParentalInvolvement("");
      setSchoolType("");
      setPeerInfluence("");
      setExtracurricularActivities("");
      setLearningDisabilities("");
      setInternetAccess("");
      setAccessToResources("");
      setTeacherQuality("");
      setFamilyIncome("");
      setTutoringSessions("");
      setPhysicalActivity("");
      
      // Recarregar dados do servidor para garantir sincronização
      await loadHabits();
      
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
      
      // Criar objeto apenas com campos realmente preenchidos
      // IMPORTANTE: Sempre enviar os valores ATUAIS do formulário, mesmo que sejam 0
      const dadosParaSalvar: any = {};
      
      // Campos básicos - SEMPRE enviar se o campo não estiver vazio
      if (horasEstudo && horasEstudo.trim() !== '') {
        const horasEstudoNum = Number(horasEstudo);
        if (!isNaN(horasEstudoNum)) {
          dadosParaSalvar.horasEstudo = horasEstudoNum;
        }
      }
      if (horasSono && horasSono.trim() !== '') {
        const horasSonoNum = Number(horasSono);
        if (!isNaN(horasSonoNum)) {
          dadosParaSalvar.sono = horasSonoNum;
        }
      }
      if (motivacao && motivacao.trim() !== '') {
        const motivacaoNum = Number(motivacao);
        if (!isNaN(motivacaoNum)) {
          dadosParaSalvar.motivacao = motivacaoNum;
        }
      }
      if (frequencia && frequencia.trim() !== '') {
        const frequenciaNum = Number(frequencia);
        if (!isNaN(frequenciaNum)) {
          dadosParaSalvar.frequencia = frequenciaNum;
        }
      }
      
      // Previous_Scores removido para evitar viés - não é mais necessário
      
      
      // Adicionar campos adicionais APENAS se realmente preenchidos
      if (distanceFromHome && distanceFromHome.trim() !== '') {
        dadosParaSalvar.Distance_from_Home = distanceFromHome;
      }
      if (gender && gender.trim() !== '') {
        dadosParaSalvar.Gender = gender;
      }
      if (parentalEducationLevel && parentalEducationLevel.trim() !== '') {
        dadosParaSalvar.Parental_Education_Level = parentalEducationLevel;
      }
      if (parentalInvolvement && parentalInvolvement.trim() !== '') {
        dadosParaSalvar.Parental_Involvement = parentalInvolvement;
      }
      if (schoolType && schoolType.trim() !== '') {
        dadosParaSalvar.School_Type = schoolType;
      }
      if (peerInfluence && peerInfluence.trim() !== '') {
        dadosParaSalvar.Peer_Influence = peerInfluence;
      }
      if (extracurricularActivities && extracurricularActivities.trim() !== '') {
        dadosParaSalvar.Extracurricular_Activities = extracurricularActivities;
      }
      if (learningDisabilities && learningDisabilities.trim() !== '') {
        dadosParaSalvar.Learning_Disabilities = learningDisabilities;
      }
      if (internetAccess && internetAccess.trim() !== '') {
        dadosParaSalvar.Internet_Access = internetAccess;
      }
      if (accessToResources && accessToResources.trim() !== '') {
        dadosParaSalvar.Access_to_Resources = accessToResources;
      }
      if (teacherQuality && teacherQuality.trim() !== '') {
        dadosParaSalvar.Teacher_Quality = teacherQuality;
      }
      if (familyIncome && familyIncome.trim() !== '') {
        dadosParaSalvar.Family_Income = familyIncome;
      }
      if (tutoringSessions && tutoringSessions.trim() !== '') {
        dadosParaSalvar.Tutoring_Sessions = tutoringSessions;
      }
      if (physicalActivity && physicalActivity.trim() !== '') {
        dadosParaSalvar.Physical_Activity = physicalActivity;
      }
      
      
      await submitHabits(dadosParaSalvar);
      
      // Recarregar dados do servidor para garantir sincronização
      await loadHabits();
      
      setSuccessMessage("Todos os dados foram salvos com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erro ao salvar dados.";
      setValidationError(errorMsg);
      Alert.alert("Erro", errorMsg);
    }
  };

  const handlePredictPerformance = async (useDefaultValues: boolean = false) => {
    
    if (!user?.IDUser) {
      console.error('❌ Usuário não autenticado');
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }
    
    // Validar se uma matéria foi selecionada
    if (!selectedMatriculaId) {
      Alert.alert("Atenção", "Por favor, selecione uma matéria antes de calcular o desempenho.");
      return;
    }
    
    // Validar campos básicos (permite campos vazios - usarão valores padrão)
    const basicValid = validateBasic();
    if (!basicValid) {
      // A validação só falha se os valores preenchidos estiverem fora do range
      // Campos vazios são permitidos e usarão valores padrão
      return;
    }
    
    setPredictionLoading(true);
    setPredictionError(null);
    setValidationError(null);
    
    try {
      // Preparar dados para predição
      // IMPORTANTE: SEMPRE enviar os valores ATUAIS do formulário, mesmo que já existam dados salvos
      // Isso garante que a predição use os valores mais recentes que o usuário preencheu, não valores antigos salvos
      const predictionData: any = {};
      
      // Valores padrão quando campos estiverem vazios
      const DEFAULT_VALUES = {
        horasEstudo: 28,      // Médio (21-35h)
        sono: 7.5,            // Adequado (7-8h)
        motivacao: 5.5,        // Média (5-6)
        frequencia: 70,       // Média (61-80%)
        // Campos adicionais - valores padrão
        Distance_from_Home: "Near",           // Perto
        Gender: "Male",                        // Masculino
        Parental_Education_Level: "High School", // Ensino Médio
        Parental_Involvement: "Medium",        // Médio
        School_Type: "Public",                 // Pública
        Peer_Influence: "Neutral",             // Neutra
        Extracurricular_Activities: "Yes",      // Sim
        Learning_Disabilities: "No",           // Não
        Internet_Access: "Yes",                // Sim
        Access_to_Resources: "Average",        // Médio
        Teacher_Quality: "Average",            // Médio
        Family_Income: "Medium",               // Médio
        Tutoring_Sessions: "No",              // Não
        Physical_Activity: "Medium",           // Médio
      };
      
      // Campos básicos - SEMPRE enviar valores (usar padrão se vazio)
      // Usar valores do estado atual, não valores salvos
      if (horasEstudo && horasEstudo.trim() !== '') {
        const horasEstudoNum = Number(horasEstudo);
        if (!isNaN(horasEstudoNum)) {
          predictionData.horasEstudo = horasEstudoNum;
        } else {
          predictionData.horasEstudo = DEFAULT_VALUES.horasEstudo;
        }
      } else {
        predictionData.horasEstudo = DEFAULT_VALUES.horasEstudo;
      }
      
      if (horasSono && horasSono.trim() !== '') {
        const horasSonoNum = Number(horasSono);
        if (!isNaN(horasSonoNum)) {
          predictionData.sono = horasSonoNum;
        } else {
          predictionData.sono = DEFAULT_VALUES.sono;
        }
      } else {
        predictionData.sono = DEFAULT_VALUES.sono;
      }
      
      if (motivacao && motivacao.trim() !== '') {
        const motivacaoNum = Number(motivacao);
        if (!isNaN(motivacaoNum)) {
          predictionData.motivacao = motivacaoNum;
        } else {
          predictionData.motivacao = DEFAULT_VALUES.motivacao;
        }
      } else {
        predictionData.motivacao = DEFAULT_VALUES.motivacao;
      }
      
      if (frequencia && frequencia.trim() !== '') {
        const frequenciaNum = Number(frequencia);
        if (!isNaN(frequenciaNum)) {
          predictionData.frequencia = frequenciaNum;
        } else {
          predictionData.frequencia = DEFAULT_VALUES.frequencia;
        }
      } else {
        predictionData.frequencia = DEFAULT_VALUES.frequencia;
      }
      // Previous_Scores removido para evitar viés - não é mais necessário
      
      
          // IMPORTANTE: Só enviar campos adicionais se o toggle estiver ATIVADO
          // Se o toggle estiver desativado, NÃO enviar nenhum campo adicional (nem valores padrão)
          if (showAdditionalFields) {
            // Se campos adicionais estão ativados, usar valores preenchidos ou padrão
            // Sempre enviar todos os campos adicionais (preenchidos ou com valores padrão)
            // Garantir que sempre sejam strings não vazias
            const getValueOrDefault = (value: string, defaultValue: string): string => {
              return (value && value.trim() !== '') ? value.trim() : defaultValue;
            };
            
            predictionData.Distance_from_Home = getValueOrDefault(distanceFromHome, DEFAULT_VALUES.Distance_from_Home);
            predictionData.Gender = getValueOrDefault(gender, DEFAULT_VALUES.Gender);
            predictionData.Parental_Education_Level = getValueOrDefault(parentalEducationLevel, DEFAULT_VALUES.Parental_Education_Level);
            predictionData.Parental_Involvement = getValueOrDefault(parentalInvolvement, DEFAULT_VALUES.Parental_Involvement);
            predictionData.School_Type = getValueOrDefault(schoolType, DEFAULT_VALUES.School_Type);
            predictionData.Peer_Influence = getValueOrDefault(peerInfluence, DEFAULT_VALUES.Peer_Influence);
            predictionData.Extracurricular_Activities = getValueOrDefault(extracurricularActivities, DEFAULT_VALUES.Extracurricular_Activities);
            predictionData.Learning_Disabilities = getValueOrDefault(learningDisabilities, DEFAULT_VALUES.Learning_Disabilities);
            predictionData.Internet_Access = getValueOrDefault(internetAccess, DEFAULT_VALUES.Internet_Access);
            predictionData.Access_to_Resources = getValueOrDefault(accessToResources, DEFAULT_VALUES.Access_to_Resources);
            predictionData.Teacher_Quality = getValueOrDefault(teacherQuality, DEFAULT_VALUES.Teacher_Quality);
            predictionData.Family_Income = getValueOrDefault(familyIncome, DEFAULT_VALUES.Family_Income);
            predictionData.Tutoring_Sessions = getValueOrDefault(tutoringSessions, DEFAULT_VALUES.Tutoring_Sessions);
            predictionData.Physical_Activity = getValueOrDefault(physicalActivity, DEFAULT_VALUES.Physical_Activity);
            
            // Verificar se todos os campos obrigatórios estão presentes
            const requiredFields = [
              'Distance_from_Home', 'Gender', 'Parental_Education_Level', 'Parental_Involvement',
              'School_Type', 'Peer_Influence', 'Extracurricular_Activities', 'Learning_Disabilities',
              'Internet_Access', 'Access_to_Resources', 'Teacher_Quality', 'Family_Income',
              'Tutoring_Sessions', 'Physical_Activity'
            ];
            
            const missingFields = requiredFields.filter(field => {
              const value = predictionData[field];
              return !value || value === '' || value === null || value === undefined;
            });
            
            if (missingFields.length > 0) {
              console.error('❌ Campos obrigatórios faltando após aplicar valores padrão:', missingFields);
              console.error('📊 Dados atuais:', predictionData);
            }
          } else {
            // Não adicionar nenhum campo adicional quando o toggle está desativado
          }
      
      // Debug: Log dos dados que serão enviados
      console.log('📊 Dados para predição:', JSON.stringify(predictionData, null, 2));
      console.log('🔘 Toggle de campos adicionais:', showAdditionalFields);
      
      // Validar se temos uma matrícula selecionada ANTES de calcular
      if (!selectedMatriculaId) {
        Alert.alert("Atenção", "Por favor, selecione uma matéria antes de calcular o desempenho.");
        setPredictionLoading(false);
        return;
      }
      
      // Se temos uma matrícula selecionada, usar ela para salvar a predição
      const result = await PredictionService.predictPerformance(
        predictionData,
        selectedMatriculaId // Passar IDMatricula - obrigatório agora
      );
      
      // Pequeno delay para garantir que o loading seja visível
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Invalidar cache de matrículas após criar nova predição
      // (a predição pode ter mudado o estado da matrícula)
      await clearMatriculasCache();
      setMatriculasLoaded(false);
      
      // Navegar para a tela de resultados
      navigation.navigate("PredictionResult", { predictionResult: result });
    } catch (err: any) {
      console.error('❌ Erro ao processar predição:', err);
      console.error('   Response:', err?.response?.data);
      console.error('   Message:', err?.message);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Erro ao gerar predição de desempenho.";
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

  // Componente para campos com opção de classificação ou valor
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


  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Formulário</Text>
          <Text style={styles.subtitle}>
            Selecione a matéria e preencha os campos para calcular o desempenho.
          </Text>
        </View>

        {/* Seletor de Matéria */}
        {matriculas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione a Matéria</Text>
            {loadingMatriculas ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.subjectSelector}
                contentContainerStyle={styles.subjectSelectorContent}
              >
                {matriculas.map((matricula) => {
                  const isSelected = matricula.IDMatricula === selectedMatriculaId;
                  return (
                    <TouchableOpacity
                      key={matricula.IDMatricula}
                      style={[
                        styles.subjectButton,
                        isSelected && styles.subjectButtonSelected
                      ]}
                      onPress={() => {
                        setSelectedMatriculaId(matricula.IDMatricula);
                        setSelectedDisciplina(matricula.disciplina.NomeDaDisciplina);
                        // Recarregar última predição para a matéria selecionada
                      }}
                    >
                      <Text
                        style={[
                          styles.subjectButtonText,
                          isSelected && styles.subjectButtonTextSelected
                        ]}
                        numberOfLines={2}
                      >
                        {matricula.disciplina.NomeDaDisciplina}
                      </Text>
                      {matricula.disciplina.CodigoDaDisciplina && (
                        <Text
                          style={[
                            styles.subjectButtonCode,
                            isSelected && styles.subjectButtonCodeSelected
                          ]}
                        >
                          {matricula.disciplina.CodigoDaDisciplina}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {selectedDisciplina && (
              <View style={styles.selectedSubjectInfo}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={styles.selectedSubjectText}>
                  Calculando para: {selectedDisciplina}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campos Básicos</Text>
          
          {renderFieldWithOptions(
            "Horas de Estudo Semanais:",
            "Quantas horas você estuda por semana? (Ex: 35 horas = ~5h por dia)",
            horasEstudo,
            setHorasEstudo,
            horasEstudoClassification,
            setHorasEstudoClassification,
            horasEstudoMode,
            setHorasEstudoMode,
            PICKER_OPTIONS.horasEstudo,
            "Selecione ou digite o valor"
          )}
          
          {renderFieldWithOptions(
            "Horas de Sono:",
            "Quantas horas você dorme por noite?",
            horasSono,
            setHorasSono,
            horasSonoClassification,
            setHorasSonoClassification,
            horasSonoMode,
            setHorasSonoMode,
            PICKER_OPTIONS.horasSono,
            "Selecione ou digite o valor"
          )}
          
          {renderFieldWithOptions(
            "Nível de Motivação:",
            "Como você avalia sua motivação para estudar?",
            motivacao,
            setMotivacao,
            motivacaoClassification,
            setMotivacaoClassification,
            motivacaoMode,
            setMotivacaoMode,
            PICKER_OPTIONS.motivacao,
            "Selecione ou digite o valor"
          )}
          
          {renderFieldWithOptions(
            "Frequência às Aulas (%):",
            "Qual sua porcentagem de presença nas aulas?",
            frequencia,
            setFrequencia,
            frequenciaClassification,
            setFrequenciaClassification,
            frequenciaMode,
            setFrequenciaMode,
            PICKER_OPTIONS.frequencia,
            "Selecione ou digite o valor"
          )}
          
          {/* Previous_Scores removido para evitar viés - não é mais necessário */}

          {/* Toggle para Campos Adicionais */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setShowAdditionalFields(!showAdditionalFields);
                // Se desativar, limpar campos adicionais
                if (showAdditionalFields) {
                  setDistanceFromHome("");
                  setGender("");
                  setParentalEducationLevel("");
                  setParentalInvolvement("");
                  setSchoolType("");
                  setPeerInfluence("");
                  setExtracurricularActivities("");
                  setLearningDisabilities("");
                  setInternetAccess("");
                  setAccessToResources("");
                  setTeacherQuality("");
                  setFamilyIncome("");
                  setTutoringSessions("");
                  setPhysicalActivity("");
                }
              }}
            >
              <View style={[styles.toggleSwitch, showAdditionalFields && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, showAdditionalFields && styles.toggleThumbActive]} />
              </View>
              <Text style={styles.toggleLabel}>Incluir Campos Adicionais</Text>
            </TouchableOpacity>
            <Text style={styles.toggleDescription}>
              {showAdditionalFields 
                ? "Campos adicionais ativados. Preencha para uma predição mais precisa."
                : "Ative para preencher dados pessoais, familiares e ambientais."}
            </Text>
          </View>

          {/* Campos Adicionais (mostrar apenas se toggle estiver ativo) */}
          {showAdditionalFields && (
            <View style={styles.additionalSection}>
              <Text style={styles.additionalSectionTitle}>Campos Adicionais</Text>
              
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
            </View>
          )}

          {validationError && <Text style={styles.errorText}>{validationError}</Text>}
          {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
          
          <TouchableOpacity 
            style={[styles.predictButton, (predictionLoading || loading) && { opacity: 0.6 }]} 
            onPress={() => {
              // Sempre usar valores padrão quando campos estiverem vazios
              handlePredictPerformance(false);
            }} 
            disabled={predictionLoading || loading}
          >
            {predictionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Prever Desempenho</Text>}
          </TouchableOpacity>
        </View>

        {predictionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Erro ao processar predição</Text>
            <Text style={styles.errorText}>{predictionError}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg || "#f5f5f5", paddingTop: 0 },
  scrollContent: { paddingBottom: 80, paddingTop: 10 }, // Aumentar paddingBottom para tab bar
  selectionContainer: { flex: 1, justifyContent: "center", padding: 20 },
  header: { padding: 20, paddingBottom: 10 },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backButtonText: { fontSize: 16, color: colors.primary || "#4A90E2", marginLeft: 8 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.text || "#333" },
  subtitle: { fontSize: 14, color: colors.muted || "#666", marginBottom: 10, textAlign: "center" },
  selectionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  selectionIconContainer: { alignItems: "center", marginBottom: 16 },
  selectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.text || "#333" },
  selectionDescription: { fontSize: 14, color: colors.muted || "#666", textAlign: "center", lineHeight: 20 },
  section: { backgroundColor: "#fff", marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: colors.text || "#333", borderBottomWidth: 2, borderBottomColor: colors.primary || "#4A90E2", paddingBottom: 8 },
  additionalSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  additionalSectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: colors.text || "#333" },
  toggleContainer: { marginTop: 24, marginBottom: 16, padding: 16, backgroundColor: "#F9FAFB", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  toggleButton: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  toggleSwitch: { width: 50, height: 28, borderRadius: 14, backgroundColor: "#D1D5DB", marginRight: 12, justifyContent: "center", padding: 2 },
  toggleSwitchActive: { backgroundColor: colors.primary || "#4A90E2" },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", alignSelf: "flex-start" },
  toggleThumbActive: { alignSelf: "flex-end" },
  toggleLabel: { fontSize: 16, fontWeight: "600", color: colors.text || "#333", flex: 1 },
  toggleDescription: { fontSize: 13, color: colors.muted || "#666", marginLeft: 62 },
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
  fieldContainer: { marginBottom: 16 },
  modeToggle: { flexDirection: "row", marginBottom: 12, backgroundColor: "#F3F4F6", borderRadius: 8, padding: 4 },
  modeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 6, gap: 6 },
  modeButtonActive: { backgroundColor: colors.primary || "#4A90E2" },
  modeButtonText: { fontSize: 14, color: colors.muted || "#666", fontWeight: "600" },
  modeButtonTextActive: { color: "#fff" },
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
  // Estilos para seletor de matéria
  subjectSelector: { marginTop: 12 },
  subjectSelectorContent: { paddingHorizontal: 4 },
  subjectButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectButtonSelected: {
    borderColor: colors.primary || "#4A90E2",
    backgroundColor: "#E3F2FD",
  },
  subjectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text || "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  subjectButtonTextSelected: {
    color: colors.primary || "#4A90E2",
  },
  subjectButtonCode: {
    fontSize: 11,
    color: colors.muted || "#666",
    textAlign: "center",
  },
  subjectButtonCodeSelected: {
    color: colors.primary || "#4A90E2",
  },
  selectedSubjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success || "#10B981",
  },
  selectedSubjectText: {
    fontSize: 14,
    color: colors.text || "#333",
    marginLeft: 8,
    fontWeight: "500",
  },
});

export default HabitScreen;
