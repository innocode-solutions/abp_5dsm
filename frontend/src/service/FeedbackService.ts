/**
 * Serviço para processar explicações de predições e gerar feedbacks personalizados e amigáveis
 */

export interface ParsedFeature {
  feature: string;
  value: string | number;
  influence: 'positiva' | 'negativa';
  impact: 'high' | 'medium' | 'low';
}

export interface FeedbackMessage {
  title: string;
  message: string;
  features: ParsedFeature[];
  suggestions: string[];
}

// Mapeamento de features técnicas para nomes amigáveis (case-insensitive)
const FEATURE_NAMES_MAP: Record<string, string> = {
  // Horas de Estudo - várias variações
  'horasestudo': 'Horas de Estudo',
  'horas_estudo': 'Horas de Estudo',
  'hours_studied': 'Horas de Estudo',
  'hoursstudied': 'Horas de Estudo',
  'study_hours': 'Horas de Estudo',
  'studyhours': 'Horas de Estudo',
  
  // Sono
  'sono': 'Horas de Sono',
  'sleep': 'Horas de Sono',
  'sleep_hours': 'Horas de Sono',
  'sleephours': 'Horas de Sono',
  
  // Motivação
  'motivacao': 'Nível de Motivação',
  'motivation': 'Nível de Motivação',
  'motivation_level': 'Nível de Motivação',
  'motivationlevel': 'Nível de Motivação',
  
  // Frequência
  'frequencia': 'Frequência às Aulas',
  'frequency': 'Frequência às Aulas',
  'attendance': 'Frequência às Aulas',
  'attendance_rate': 'Frequência às Aulas',
  
  // Notas Anteriores
  'previous_scores': 'Notas Anteriores',
  'previousscores': 'Notas Anteriores',
  'previous_grades': 'Notas Anteriores',
  'previousgrades': 'Notas Anteriores',
  
  // Distância
  'distance_from_home': 'Distância de Casa',
  'distancefromhome': 'Distância de Casa',
  'distance': 'Distância de Casa',
  
  // Gênero
  'gender': 'Gênero',
  
  // Educação dos Pais
  'parental_education_level': 'Nível Educacional dos Pais',
  'parentaleducationlevel': 'Nível Educacional dos Pais',
  'parent_education': 'Nível Educacional dos Pais',
  
  // Envolvimento dos Pais
  'parental_involvement': 'Envolvimento dos Pais',
  'parentalinvolvement': 'Envolvimento dos Pais',
  'parent_involvement': 'Envolvimento dos Pais',
  
  // Tipo de Escola
  'school_type': 'Tipo de Escola',
  'schooltype': 'Tipo de Escola',
  
  // Influência dos Colegas
  'peer_influence': 'Influência dos Colegas',
  'peerinfluence': 'Influência dos Colegas',
  
  // Atividades Extracurriculares
  'extracurricular_activities': 'Atividades Extracurriculares',
  'extracurricularactivities': 'Atividades Extracurriculares',
  
  // Deficiências de Aprendizagem
  'learning_disabilities': 'Deficiências de Aprendizagem',
  'learningdisabilities': 'Deficiências de Aprendizagem',
  
  // Acesso à Internet
  'internet_access': 'Acesso à Internet',
  'internetaccess': 'Acesso à Internet',
  
  // Acesso a Recursos
  'access_to_resources': 'Acesso a Recursos',
  'accesstoresources': 'Acesso a Recursos',
  'resources': 'Acesso a Recursos',
  
  // Qualidade do Professor
  'teacher_quality': 'Qualidade do Professor',
  'teacherquality': 'Qualidade do Professor',
  
  // Renda Familiar
  'family_income': 'Renda Familiar',
  'familyincome': 'Renda Familiar',
  'income': 'Renda Familiar',
  
  // Tutoria
  'tutoring_sessions': 'Sessões de Tutoria',
  'tutoringsessions': 'Sessões de Tutoria',
  'tutoring': 'Sessões de Tutoria',
  
  // Atividade Física
  'physical_activity': 'Atividade Física',
  'physicalactivity': 'Atividade Física',
  
  // Participação em Aula
  'raisedhands': 'Participação em Aula',
  'raised_hands': 'Participação em Aula',
  'participation': 'Participação em Aula',
  
  // Materiais Acessados
  'visitedresources': 'Materiais Acessados',
  'visited_resources': 'Materiais Acessados',
  'resources_accessed': 'Materiais Acessados',
  'visitresources': 'Materiais Acessados', // Variante VisITedResources
  
  // Avisos Visualizados
  'announcementsview': 'Avisos Visualizados',
  'announcements_view': 'Avisos Visualizados',
  'announcements': 'Avisos Visualizados',
  
  // Discussões
  'discussion': 'Participações em Discussões',
  'discussions': 'Participações em Discussões',
  
  // Pesquisa dos Pais
  'parentansweringsurvey': 'Pais Responderam Pesquisa',
  'parent_answering_survey': 'Pais Responderam Pesquisa',
  
  // Satisfação dos Pais
  'parentschoolsatisfaction': 'Satisfação dos Pais',
  'parent_school_satisfaction': 'Satisfação dos Pais',
  
  // Faltas
  'studentabsencedays': 'Faltas Escolares',
  'student_absence_days': 'Faltas Escolares',
  'absences': 'Faltas Escolares',
  'absence_days': 'Faltas Escolares',
};

/**
 * Converte nome técnico de feature para nome amigável
 * Faz busca case-insensitive e remove underscores/hífens
 */
function getFriendlyFeatureName(feature: string): string {
  if (!feature) return feature;
  
  // Normaliza: remove espaços, underscores, hífens e converte para lowercase
  const normalized = feature.trim().replace(/[_\s-]/g, '').toLowerCase();
  
  // Busca direta
  if (FEATURE_NAMES_MAP[normalized]) {
    return FEATURE_NAMES_MAP[normalized];
  }
  
  // Busca parcial (para casos como "Hours_studied__0" ou "preprocessor__Hours_studied")
  for (const [key, value] of Object.entries(FEATURE_NAMES_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Se não encontrou, tenta formatar o nome original de forma mais amigável
  return feature
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Retorna o artigo correto (seu/sua/suas/seus) baseado no nome da feature
 */
function getCorrectArticle(featureName: string): string {
  const name = featureName.toLowerCase();
  
  // Features no plural que usam "suas" ou "seus"
  if (name.includes('deficiências') || name.includes('atividades') || 
      name.includes('participações') || name.includes('materiais') ||
      name.includes('faltas') || name.includes('sessões') || name.includes('avisos') ||
      name.includes('notas anteriores')) {
    return name.includes('materiais') || name.includes('avisos') ? 'seus' : 'suas';
  }
  
  // Features femininas que usam "sua"
  if (name.includes('frequência') || name.includes('motivação') ||
      name.includes('renda') || name.includes('distância') || name.includes('qualidade') ||
      name.includes('satisfação') || name.includes('influência') || name.includes('nota')) {
    return 'sua';
  }
  
  // Features masculinas que usam "seu"
  return 'seu';
}

/**
 * Corrige a influência baseada no valor da feature (para valores categóricos)
 */
function correctInfluenceByValue(featureName: string, value: string | number, originalInfluence: 'positiva' | 'negativa'): 'positiva' | 'negativa' {
  const friendlyName = getFriendlyFeatureName(featureName);
  
  // Frequência às Aulas: >= 80% = positivo, < 80% = negativo
  if (friendlyName === 'Frequência às Aulas' && typeof value === 'number') {
    return value >= 80 ? 'positiva' : 'negativa';
  }
  
  // Se for numérico e não for Frequência, mantém a influência original
  if (typeof value === 'number') {
    return originalInfluence;
  }
  
  const valueStr = String(value).toLowerCase().trim();
  
  // Para features específicas, verifica o contexto ANTES de aplicar regras genéricas
  
  // Deficiências de Aprendizagem: Yes = NEGATIVO (ter deficiência é ruim), No = POSITIVO (não ter é bom)
  if (friendlyName === 'Deficiências de Aprendizagem') {
    if (valueStr === 'yes' || valueStr === 'sim') {
      return 'negativa';
    }
    if (valueStr === 'no' || valueStr === 'não' || valueStr === 'nao') {
      return 'positiva';
    }
  }
  
  // Atividades Extracurriculares: Yes = POSITIVO (ter atividades é bom), No = NEGATIVO
  if (friendlyName === 'Atividades Extracurriculares') {
    if (valueStr === 'yes' || valueStr === 'sim') {
      return 'positiva';
    }
    if (valueStr === 'no' || valueStr === 'não' || valueStr === 'nao') {
      return 'negativa';
    }
  }
  
  // Acesso à Internet: Yes = POSITIVO (ter acesso é bom), No = NEGATIVO
  if (friendlyName === 'Acesso à Internet') {
    if (valueStr === 'yes' || valueStr === 'sim') {
      return 'positiva';
    }
    if (valueStr === 'no' || valueStr === 'não' || valueStr === 'nao') {
      return 'negativa';
    }
  }
  
  // Sessões de Tutoria: Yes = POSITIVO (ter tutoria é bom), No = NEGATIVO
  if (friendlyName === 'Sessões de Tutoria') {
    if (valueStr === 'yes' || valueStr === 'sim') {
      return 'positiva';
    }
    if (valueStr === 'no' || valueStr === 'não' || valueStr === 'nao') {
      return 'negativa';
    }
  }
  
  // Pais Responderam Pesquisa: Yes = POSITIVO (envolvimento é bom), No = NEGATIVO
  if (friendlyName === 'Pais Responderam Pesquisa') {
    if (valueStr === 'yes' || valueStr === 'sim') {
      return 'positiva';
    }
    if (valueStr === 'no' || valueStr === 'não' || valueStr === 'nao') {
      return 'negativa';
    }
  }
  
  // Satisfação dos Pais: Good = POSITIVO, Bad = NEGATIVO
  if (friendlyName === 'Satisfação dos Pais') {
    if (valueStr.includes('good') || valueStr.includes('bom') || valueStr.includes('boa')) {
      return 'positiva';
    }
    if (valueStr.includes('bad') || valueStr.includes('ruim')) {
      return 'negativa';
    }
  }
  
  // Acesso a Recursos: Good/Average = positivo, Poor = negativo
  if (friendlyName === 'Acesso a Recursos' || friendlyName === 'Qualidade do Professor') {
    if (valueStr.includes('good') || valueStr.includes('average') || valueStr.includes('bom') || valueStr.includes('médio')) {
      return 'positiva';
    }
    if (valueStr.includes('poor') || valueStr.includes('ruim')) {
      return 'negativa';
    }
  }
  
  // Nível Educacional: Bachelor's/Master's = positivo, None/High School = pode ser negativo
  if (friendlyName === 'Nível Educacional dos Pais') {
    if (valueStr.includes("bachelor's") || valueStr.includes("master's") || valueStr.includes('some college')) {
      return 'positiva';
    }
    if (valueStr.includes('none') || valueStr.includes('nenhum')) {
      return 'negativa';
    }
  }
  
  // Envolvimento, Motivação, Renda, Atividade Física: High = positivo, Low = negativo
  if (friendlyName === 'Envolvimento dos Pais' || 
      friendlyName === 'Nível de Motivação' || 
      friendlyName === 'Renda Familiar' ||
      friendlyName === 'Atividade Física') {
    if (valueStr.includes('high') || valueStr.includes('alto') || valueStr.includes('alta')) {
      return 'positiva';
    }
    if (valueStr.includes('low') || valueStr.includes('baixo') || valueStr.includes('baixa')) {
      return 'negativa';
    }
  }
  
  // Influência dos Colegas: Positive = positivo, Negative = negativo
  if (friendlyName === 'Influência dos Colegas') {
    if (valueStr.includes('positive') || valueStr.includes('positiva')) {
      return 'positiva';
    }
    if (valueStr.includes('negative') || valueStr.includes('negativa')) {
      return 'negativa';
    }
  }
  
  // Faltas: Under-7 = positivo, Above-7 = negativo
  if (friendlyName === 'Faltas Escolares') {
    // Reconhece tanto o formato original (Under-7/Above-7) quanto o formato formatado (Menos de 7 faltas/Acima de 7 faltas)
    if (valueStr.includes('under-7') || valueStr.includes('under 7') || 
        valueStr.includes('menos de 7') || valueStr.includes('menos de 7 faltas')) {
      return 'positiva';
    }
    if (valueStr.includes('above-7') || valueStr.includes('above 7') || 
        valueStr.includes('acima de 7') || valueStr.includes('acima de 7 faltas')) {
      return 'negativa';
    }
  }
  
  // Distância: Near = positivo, Far = negativo
  if (friendlyName === 'Distância de Casa') {
    if (valueStr.includes('near') || valueStr.includes('perto')) {
      return 'positiva';
    }
    if (valueStr.includes('far') || valueStr.includes('longe')) {
      return 'negativa';
    }
  }
  
  // Valores genéricos (apenas para campos não tratados acima)
  // Valores que são sempre positivos
  const positiveValues = ['good', 'high', 'positive', 'near', "bachelor's", "master's", 'some college'];
  // Valores que são sempre negativos
  const negativeValues = ['poor', 'low', 'negative', 'far', 'none', 'bad', 'above-7'];
  
  if (positiveValues.some(pv => valueStr.includes(pv))) {
    return 'positiva';
  }
  
  if (negativeValues.some(nv => valueStr.includes(nv))) {
    return 'negativa';
  }
  
  // Se não conseguir determinar, mantém a influência original
  return originalInfluence;
}

/**
 * Extrai features da explicação de performance
 */
function parsePerformanceExplanation(explanation: string): ParsedFeature[] {
  const features: ParsedFeature[] = [];
  const seenFeatures = new Set<string>(); // Para evitar duplicatas
  
  // Procura por padrão: "feature: value (influência positiva/negativa)"
  const factorPattern = /([^:]+):\s*([^(]+)\s*\(influência\s+(positiva|negativa)\)/gi;
  let match;
  
  while ((match = factorPattern.exec(explanation)) !== null) {
    const featureName = match[1].trim();
    let value = match[2].trim();
    const originalInfluence = match[3].toLowerCase() === 'positiva' ? 'positiva' : 'negativa';
    
    // Tenta converter valor para número se possível
    const numericValue = parseFloat(value);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue);
    
    const finalValue = isNumeric ? numericValue : value;
    
    // Corrige a influência baseada no valor (especialmente para valores categóricos)
    const correctedInfluence = correctInfluenceByValue(featureName, finalValue, originalInfluence);
    
    // Normaliza o nome da feature para comparação (evita duplicatas por diferenças de capitalização)
    const friendlyName = getFriendlyFeatureName(featureName);
    const featureKey = `${friendlyName.toLowerCase()}_${String(finalValue).toLowerCase()}`;
    
    // Só adiciona se não tiver visto esta combinação feature+valor antes
    if (!seenFeatures.has(featureKey)) {
      seenFeatures.add(featureKey);
      features.push({
        feature: friendlyName,
        value: finalValue,
        influence: correctedInfluence,
        impact: 'high', // Features mencionadas são sempre de alto impacto
      });
    }
  }
  
  return features;
}

/**
 * Extrai features da explicação de evasão
 */
function parseDropoutExplanation(explanation: string): ParsedFeature[] {
  const features: ParsedFeature[] = [];
  const seenFeatures = new Set<string>(); // Para evitar duplicatas
  
  // Tenta diferentes padrões de explicação
  // Padrão 1: "feature: value (influência positiva/negativa)"
  const factorPattern = /([^:]+):\s*([^(]+)\s*\(influência\s+(positiva|negativa)\)/gi;
  let match;
  
  while ((match = factorPattern.exec(explanation)) !== null) {
    const featureName = match[1].trim();
    let value = match[2].trim();
    const originalInfluence = match[3].toLowerCase() === 'positiva' ? 'positiva' : 'negativa';
    
    // Tenta converter valor para número se possível
    const numericValue = parseFloat(value);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue);
    const finalValue = isNumeric ? numericValue : value;
    
    // Corrige a influência baseada no valor (especialmente para valores categóricos)
    const correctedInfluence = correctInfluenceByValue(featureName, finalValue, originalInfluence);
    
    // Normaliza o nome da feature para comparação (evita duplicatas por diferenças de capitalização)
    const friendlyName = getFriendlyFeatureName(featureName);
    const featureKey = `${friendlyName.toLowerCase()}_${String(finalValue).toLowerCase()}`;
    
    // Só adiciona se não tiver visto esta combinação feature+valor antes
    if (!seenFeatures.has(featureKey)) {
      seenFeatures.add(featureKey);
      features.push({
        feature: friendlyName,
        value: finalValue,
        influence: correctedInfluence,
        impact: 'high',
      });
    }
  }
  
  // Se não encontrou features, tenta extrair informações gerais
  if (features.length === 0) {
    // Procura por palavras-chave comuns
    const keywords = [
      { pattern: /(poucas|baixas?)\s+horas?\s+de\s+estudo/gi, feature: 'Horas de Estudo', influence: 'negativa' as const },
      { pattern: /(muitas?|altas?)\s+horas?\s+de\s+estudo/gi, feature: 'Horas de Estudo', influence: 'positiva' as const },
      { pattern: /(baixa|pouca)\s+frequência/gi, feature: 'Frequência às Aulas', influence: 'negativa' as const },
      { pattern: /(alta|boa)\s+frequência/gi, feature: 'Frequência às Aulas', influence: 'positiva' as const },
      { pattern: /(poucas?|baixas?)\s+participações?/gi, feature: 'Participação em Aula', influence: 'negativa' as const },
      { pattern: /(muitas?|altas?)\s+participações?/gi, feature: 'Participação em Aula', influence: 'positiva' as const },
      { pattern: /(muitas?|altas?)\s+faltas?/gi, feature: 'Faltas Escolares', influence: 'negativa' as const },
      { pattern: /(poucas?|baixas?)\s+faltas?/gi, feature: 'Faltas Escolares', influence: 'positiva' as const },
    ];
    
    for (const keyword of keywords) {
      if (keyword.pattern.test(explanation)) {
        const featureKey = `${keyword.feature.toLowerCase()}_detectado`;
        // Verifica se já não foi adicionada
        if (!seenFeatures.has(featureKey)) {
          seenFeatures.add(featureKey);
          features.push({
            feature: keyword.feature,
            value: 'detectado',
            influence: keyword.influence,
            impact: 'high',
          });
        }
        break; // Pega apenas o primeiro match
      }
    }
  }
  
  return features;
}

/**
 * Gera sugestões baseadas nas features identificadas
 */
function generateSuggestions(features: ParsedFeature[], type: 'performance' | 'dropout'): string[] {
  const suggestions: string[] = [];
  
  for (const feature of features) {
    if (feature.influence === 'negativa') {
      const isNumeric = typeof feature.value === 'number';
      const value = feature.value;
      
      switch (feature.feature) {
        case 'Horas de Estudo':
          // value está em horas semanais
          const weeklyHours = isNumeric ? Number(value) : 0;
          const dailyHours = weeklyHours / 7;
          
          if (isNumeric && Number(weeklyHours) >= 50) {
            // 50+ horas semanais = ~7+ horas por dia - muito
            const highStudySuggestions = [
              [
                'Considere reduzir para 35-42 horas semanais (5-6h por dia) e focar na qualidade do estudo',
                'Inclua pausas regulares e atividades de descanso para evitar esgotamento',
              ],
              [
                'Equilibre melhor seu tempo: 35-42 horas semanais são suficientes com estudo de qualidade',
                'Lembre-se: descanso também é importante para o aprendizado!',
              ],
            ];
            const selected = highStudySuggestions[Math.floor(Math.random() * highStudySuggestions.length)];
            suggestions.push(...selected);
          } else if (isNumeric && weeklyHours < 20) {
            // Menos de 20 horas semanais = < 3h por dia - muito pouco
            const lowStudySuggestions = [
              [
                'Aumente suas horas de estudo para pelo menos 28-35 horas semanais (4-5h por dia)',
                'Organize um cronograma de estudos regular distribuído ao longo da semana',
              ],
              [
                'Tente dedicar mais tempo aos estudos - 28-35 horas semanais farão uma grande diferença!',
                'Crie uma rotina de estudos diária para tornar o hábito mais fácil',
              ],
            ];
            const selected = lowStudySuggestions[Math.floor(Math.random() * lowStudySuggestions.length)];
            suggestions.push(...selected);
          } else if (isNumeric && weeklyHours < 28) {
            // 20-28 horas semanais = 3-4h por dia - ainda baixo
            const mediumLowStudySuggestions = [
              [
                'Tente aumentar para pelo menos 28-35 horas semanais (4-5h por dia)',
                'Distribua o estudo ao longo da semana de forma equilibrada',
              ],
              [
                'Aumentar para 28-35 horas semanais te ajudará a ver melhorias significativas',
                'Organize seus estudos em blocos de tempo ao longo da semana',
              ],
            ];
            const selected = mediumLowStudySuggestions[Math.floor(Math.random() * mediumLowStudySuggestions.length)];
            suggestions.push(...selected);
          } else {
            // 28-50 horas semanais = 4-7h por dia - faixa razoável
            const mediumStudySuggestions = [
              [
                'Melhore a qualidade e eficiência do seu tempo de estudo',
                'Use técnicas de estudo ativo como resumos, exercícios práticos e revisões',
              ],
              [
                'Foque na qualidade do estudo - técnicas eficientes valem mais que horas extras',
                'Experimente métodos como Pomodoro, mapas mentais e prática ativa',
              ],
            ];
            const selected = mediumStudySuggestions[Math.floor(Math.random() * mediumStudySuggestions.length)];
            suggestions.push(...selected);
          }
          break;
        case 'Frequência às Aulas':
          const attendanceSuggestions = [
            [
              'Tente aumentar sua frequência às aulas para pelo menos 80%',
              'Se não puder comparecer, peça o material da aula para não perder conteúdo',
            ],
            [
              'Comparecer regularmente às aulas é fundamental - tente chegar a pelo menos 80% de frequência',
              'Quando não puder comparecer, mantenha contato com colegas e professores para não ficar para trás',
            ],
          ];
          const selectedAttendance = attendanceSuggestions[Math.floor(Math.random() * attendanceSuggestions.length)];
          suggestions.push(...selectedAttendance);
          break;
        case 'Participação em Aula':
          const participationSuggestions = [
            [
              'Participe mais ativamente das aulas fazendo perguntas e respondendo',
              'Tome notas durante as aulas para melhorar seu engajamento',
            ],
            [
              'Não tenha medo de levantar a mão e fazer perguntas - isso ajuda muito no aprendizado!',
              'Anotar durante as aulas te ajuda a se manter focado e a fixar melhor o conteúdo',
            ],
          ];
          const selectedParticipation = participationSuggestions[Math.floor(Math.random() * participationSuggestions.length)];
          suggestions.push(...selectedParticipation);
          break;
        case 'Horas de Sono':
          if (isNumeric && Number(value) < 6) {
            const lowSleepSuggestions = [
              [
                'Tente dormir pelo menos 7-8 horas por noite para melhorar sua concentração',
                'Um bom sono é essencial para fixar o aprendizado - priorize isso!',
              ],
              [
                'Dormir 7-8 horas por noite fará uma grande diferença na sua capacidade de aprendizado',
                'O sono adequado melhora a memória e a concentração - não subestime seu poder!',
              ],
            ];
            const selected = lowSleepSuggestions[Math.floor(Math.random() * lowSleepSuggestions.length)];
            suggestions.push(...selected);
          } else if (isNumeric && Number(value) > 10) {
            const highSleepSuggestions = [
              [
                'Considere reduzir um pouco o sono para ter mais tempo de estudo, mantendo 7-8 horas',
                '7-8 horas de sono são suficientes e te darão mais tempo para os estudos',
              ],
            ];
            suggestions.push(...highSleepSuggestions[Math.floor(Math.random() * highSleepSuggestions.length)]);
          } else {
            const regularSleepSuggestions = [
              'Garanta uma rotina de sono regular e de qualidade',
              'Mantenha horários consistentes para dormir e acordar',
            ];
            suggestions.push(regularSleepSuggestions[Math.floor(Math.random() * regularSleepSuggestions.length)]);
          }
          break;
        case 'Nível de Motivação':
          const motivationSuggestions = [
            [
              'Procure atividades que aumentem sua motivação para estudar',
              'Estabeleça metas claras e recompensas ao alcançá-las',
            ],
            [
              'Encontre formas de tornar os estudos mais interessantes e recompensadores',
              'Celebre cada pequena conquista - isso ajuda a manter a motivação!',
            ],
          ];
          const selectedMotivation = motivationSuggestions[Math.floor(Math.random() * motivationSuggestions.length)];
          suggestions.push(...selectedMotivation);
          break;
        case 'Faltas Escolares':
          const absenceSuggestions = [
            [
              'Reduza suas faltas para não perder conteúdo essencial',
              'Se precisar faltar, comunique-se com o professor antecipadamente',
            ],
            [
              'Cada aula perdida é uma oportunidade de aprendizado que não volta',
              'Mantenha comunicação com professores quando não puder comparecer',
            ],
          ];
          const selectedAbsence = absenceSuggestions[Math.floor(Math.random() * absenceSuggestions.length)];
          suggestions.push(...selectedAbsence);
          break;
        case 'Materiais Acessados':
          const materialsSuggestions = [
            [
              'Acesse mais materiais de estudo disponíveis na plataforma',
              'Explore vídeos, textos e exercícios complementares',
            ],
            [
              'Há muito conteúdo interessante disponível - explore mais!',
              'Vídeos, textos e exercícios extras podem te ajudar muito no aprendizado',
            ],
          ];
          const selectedMaterials = materialsSuggestions[Math.floor(Math.random() * materialsSuggestions.length)];
          suggestions.push(...selectedMaterials);
          break;
        case 'Participações em Discussões':
          const discussionSuggestions = [
            [
              'Participe mais de discussões e fóruns para melhorar seu aprendizado',
              'Faça perguntas e compartilhe suas dúvidas com colegas e professores',
            ],
            [
              'As discussões são uma ótima forma de aprender - participe mais!',
              'Não hesite em compartilhar dúvidas - isso ajuda você e seus colegas',
            ],
          ];
          const selectedDiscussion = discussionSuggestions[Math.floor(Math.random() * discussionSuggestions.length)];
          suggestions.push(...selectedDiscussion);
          break;
        case 'Deficiências de Aprendizagem':
          const learningDisabilitiesSuggestions = [
            [
              'Procure apoio especializado para trabalhar com suas deficiências de aprendizagem',
              'Converse com professores e coordenadores sobre estratégias de aprendizado adaptadas',
            ],
            [
              'Busque recursos e estratégias de aprendizado que funcionem melhor para você',
              'Não hesite em pedir ajuda - existem muitas formas de superar desafios de aprendizado',
            ],
            [
              'Explore diferentes métodos de estudo que se adaptem ao seu estilo de aprendizado',
              'Trabalhe em conjunto com educadores para desenvolver estratégias personalizadas',
            ],
          ];
          const selectedLearningDisabilities = learningDisabilitiesSuggestions[Math.floor(Math.random() * learningDisabilitiesSuggestions.length)];
          suggestions.push(...selectedLearningDisabilities);
          break;
        case 'Notas Anteriores':
          const previousScoresSuggestions = [
            [
              'Use suas notas anteriores como referência, mas não se limite a elas - você pode superar!',
              'Foque em melhorar aspectos específicos que impactam seu desempenho',
            ],
            [
              'Suas notas anteriores não definem seu potencial - cada novo período é uma nova oportunidade',
              'Identifique os pontos que mais impactam seu desempenho e trabalhe neles com dedicação',
            ],
            [
              'Não deixe notas anteriores te desanimarem - use-as como ponto de partida para crescimento',
              'Aplique estratégias de estudo diferentes e mais eficientes para ver melhorias',
            ],
          ];
          const selectedPreviousScores = previousScoresSuggestions[Math.floor(Math.random() * previousScoresSuggestions.length)];
          suggestions.push(...selectedPreviousScores);
          break;
        default:
          // Corrige a gramática para features no plural ou que precisam de artigo diferente
          const featureName = feature.feature.toLowerCase();
          let suggestionText = '';
          
          if (featureName.includes('deficiências') || featureName.includes('atividades') || 
              featureName.includes('participações') || featureName.includes('materiais') ||
              featureName.includes('faltas') || featureName.includes('sessões') ||
              featureName.includes('notas anteriores')) {
            suggestionText = `Trabalhe em suas ${featureName} para obter melhores resultados`;
          } else if (featureName.includes('frequência') || featureName.includes('motivação') ||
                     featureName.includes('renda') || featureName.includes('distância')) {
            suggestionText = `Melhore sua ${featureName} para obter melhores resultados`;
          } else {
            suggestionText = `Melhore seu ${featureName} para obter melhores resultados`;
          }
          
          suggestions.push(suggestionText);
      }
    } else {
      // Features positivas - encorajar a continuar
      switch (feature.feature) {
        case 'Horas de Estudo':
          const positiveStudySuggestions = [
            'Continue mantendo boas horas de estudo, mas não esqueça do descanso! 💪',
            'Excelente dedicação! Lembre-se de equilibrar estudo e descanso para manter o foco! ⚖️',
          ];
          suggestions.push(positiveStudySuggestions[Math.floor(Math.random() * positiveStudySuggestions.length)]);
          break;
        case 'Frequência às Aulas':
          const positiveAttendanceSuggestions = [
            'Ótimo! Continue mantendo uma boa frequência - isso está fazendo toda a diferença! 👏',
            'Excelente! Sua assiduidade está te ajudando muito - continue assim! ⭐',
          ];
          suggestions.push(positiveAttendanceSuggestions[Math.floor(Math.random() * positiveAttendanceSuggestions.length)]);
          break;
        case 'Participação em Aula':
          const positiveParticipationSuggestions = [
            'Excelente participação! Continue se envolvendo ativamente - você está no caminho certo! 🎯',
            'Ótimo trabalho! Sua participação está sendo um diferencial - mantenha esse engajamento! 🌟',
          ];
          suggestions.push(positiveParticipationSuggestions[Math.floor(Math.random() * positiveParticipationSuggestions.length)]);
          break;
        case 'Horas de Sono':
          const positiveSleepSuggestions = [
            'Continue mantendo uma boa rotina de sono - isso está te ajudando muito! 😴',
            'Ótimo! Um sono de qualidade é fundamental - continue cuidando disso! ✨',
          ];
          suggestions.push(positiveSleepSuggestions[Math.floor(Math.random() * positiveSleepSuggestions.length)]);
          break;
        default:
          const genericPositiveSuggestions = [
            `Continue mantendo esse bom hábito - está fazendo toda a diferença! 💎`,
            `Parabéns! Continue investindo nesse aspecto - está valendo a pena! 🎊`,
          ];
          suggestions.push(genericPositiveSuggestions[Math.floor(Math.random() * genericPositiveSuggestions.length)]);
      }
    }
  }
  
  // Adiciona sugestões gerais se não houver muitas específicas
  if (suggestions.length < 2) {
    if (type === 'performance') {
      const generalPerformanceSuggestions = [
        [
          'Organize um cronograma de estudos regular e cumpra-o',
          'Revise o conteúdo das aulas regularmente para fixar o aprendizado',
        ],
        [
          'Crie uma rotina de estudos consistente',
          'Faça revisões periódicas do conteúdo para melhorar a retenção',
        ],
        [
          'Estabeleça horários fixos para estudar',
          'Use técnicas de revisão espaçada para melhorar a memória',
        ],
      ];
      const selected = generalPerformanceSuggestions[Math.floor(Math.random() * generalPerformanceSuggestions.length)];
      suggestions.push(...selected);
    } else {
      const generalDropoutSuggestions = [
        [
          'Mantenha-se engajado com as atividades escolares regularmente',
          'Procure ajuda dos professores quando necessário - eles estão aqui para te ajudar!',
        ],
        [
          'Participe ativamente das atividades e mantenha contato com colegas e professores',
          'Não hesite em pedir apoio quando precisar - você não está sozinho nessa jornada!',
        ],
        [
          'Mantenha uma conexão constante com a comunidade escolar',
          'Estabeleça uma rede de apoio com professores e colegas',
        ],
      ];
      const selected = generalDropoutSuggestions[Math.floor(Math.random() * generalDropoutSuggestions.length)];
      suggestions.push(...selected);
    }
  }
  
  return suggestions.slice(0, 3); // Limita a 3 sugestões
}

/**
 * Gera feedback personalizado para predição de desempenho
 */
export function generatePerformanceFeedback(
  explanation: string,
  notaPrevista?: number,
  classificacao?: string
): FeedbackMessage {
  // Se não houver explicação, gera feedback genérico baseado na nota
  if (!explanation || explanation.trim() === '' || explanation === 'Sem explicação disponível') {
    const nota = notaPrevista || 0;
    let title = 'Feedback sobre sua Predição';
    let message = '';
    
    const excellentMessages = [
      'Sua nota prevista está excelente! 🎉 Continue mantendo seus bons hábitos de estudo - você está no caminho certo!',
      'Parabéns! Sua nota prevista está muito boa! ⭐ Seus esforços estão rendendo frutos. Continue assim!',
      'Excelente trabalho! Sua nota prevista mostra que você está se dedicando bastante! 💪 Mantenha o foco!',
    ];
    
    const goodMessages = [
      'Sua nota prevista está muito boa! 👏 Com alguns ajustes e mais dedicação, você pode alcançar resultados ainda melhores!',
      'Ótimo! Sua nota prevista está boa, mas há espaço para crescimento! 🌱 Foque nos pontos que mais impactam seu desempenho.',
      'Bom trabalho! Sua nota prevista está no caminho certo! 🎯 Com pequenos ajustes, você pode melhorar ainda mais!',
    ];
    
    const approvedMessages = [
      '🎉 Parabéns pela aprovação! Sua nota prevista acima de 60 pontos mostra que seus esforços estão dando resultado! Continue mantendo seus bons hábitos de estudo e busque melhorar ainda mais para alcançar notas ainda maiores!',
      '✅ Excelente trabalho! Você está aprovado com nota acima de 60 pontos! Isso é resultado da sua dedicação e comprometimento. Continue assim e desafie-se a alcançar notas ainda melhores!',
      '🌟 Muito bem! Você alcançou a aprovação com nota acima de 60 pontos! Seus hábitos de estudo estão funcionando. Mantenha esse ritmo e procure identificar áreas onde pode melhorar para elevar ainda mais seu desempenho!',
      '💪 Parabéns! Sua nota prevista acima de 60 pontos confirma que você está no caminho certo! Continue mantendo seus pontos fortes e trabalhe nos aspectos que podem te levar a notas ainda maiores!',
      '🎯 Ótimo resultado! Com nota acima de 60 pontos, você está aprovado! Isso mostra que sua estratégia de estudos está funcionando. Continue reforçando seus pontos positivos e busque melhorias contínuas!',
    ];
    
    const averageMessages = [
      'Sua nota prevista está na média. 💡 Com mais dedicação e organização, você tem potencial para melhorar significativamente!',
      'Sua nota prevista mostra que há espaço para crescimento! 🌟 Não desista - com foco e disciplina, você pode alcançar melhores resultados!',
      'Sua nota prevista está boa, mas pode melhorar! ✨ Identifique seus pontos fracos e trabalhe neles com dedicação!',
    ];
    
    const belowAverageMessages = [
      '⚠️ ATENÇÃO: Sua nota prevista está CRÍTICA e abaixo do esperado! É URGENTE que você aumente seu engajamento, frequência às aulas e horas de estudo. Procure ajuda dos professores imediatamente!',
      '🚨 ALERTA: Sua nota prevista está muito baixa! Você precisa tomar ações imediatas: aumentar horas de estudo, melhorar frequência e buscar apoio pedagógico. Não deixe para depois!',
      '⚠️ SITUAÇÃO CRÍTICA: Sua nota prevista está abaixo do mínimo aceitável! É fundamental que você reorganize seus estudos AGORA, compareça a todas as aulas e busque ajuda. Seu futuro acadêmico depende disso!',
      '🚨 URGENTE: Sua nota prevista está em risco! Você precisa aumentar drasticamente seu comprometimento: mais horas de estudo, frequência total às aulas e busca ativa de apoio. Aja agora!',
    ];
    
    if (nota >= 90) {
      message = excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
    } else if (nota >= 80) {
      message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    } else if (nota >= 70) {
      message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    } else if (nota >= 60) {
      message = approvedMessages[Math.floor(Math.random() * approvedMessages.length)];
    } else {
      // Nota < 60 (menor que 6.0) - mensagem crítica
      message = belowAverageMessages[Math.floor(Math.random() * belowAverageMessages.length)];
    }
    
    const genericSuggestions = [
      [
        'Aumente suas horas de estudo semanais para pelo menos 28-35 horas',
        'Melhore sua frequência às aulas - comparecer regularmente faz toda a diferença',
        'Participe mais ativamente das atividades e discussões em sala',
      ],
      [
        'Organize um cronograma de estudos regular e cumpra-o',
        'Revise o conteúdo das aulas regularmente para fixar o aprendizado',
        'Peça ajuda aos professores quando tiver dúvidas',
      ],
      [
        'Use técnicas de estudo ativo como resumos e exercícios práticos',
        'Acesse mais materiais de estudo disponíveis na plataforma',
        'Mantenha uma rotina de sono adequada (7-8 horas por noite)',
      ],
    ];
    
    // Sugestões de melhoria para aprovados (nota >= 60)
    const improvementSuggestions = [
      [
        'Continue mantendo suas horas de estudo - isso está funcionando!',
        'Procure desafiar-se com exercícios mais complexos para elevar ainda mais sua nota',
        'Mantenha sua frequência às aulas - consistência é a chave do sucesso',
      ],
      [
        'Reforce seus pontos fortes e identifique áreas para crescimento',
        'Participe de atividades extras e grupos de estudo para aprofundar conhecimentos',
        'Estabeleça metas progressivas para alcançar notas ainda maiores',
      ],
      [
        'Continue revisando o conteúdo regularmente - isso está te ajudando',
        'Busque feedback dos professores sobre como melhorar ainda mais',
        'Explore materiais complementares para aprofundar seu aprendizado',
      ],
    ];
    
    // Escolher sugestões baseado na nota
    const selectedSuggestions = nota >= 60 
      ? improvementSuggestions[Math.floor(Math.random() * improvementSuggestions.length)]
      : genericSuggestions[Math.floor(Math.random() * genericSuggestions.length)];
    
    return {
      title,
      message,
      features: [],
      suggestions: selectedSuggestions,
    };
  }
  
  // Parse da explicação
  const features = parsePerformanceExplanation(explanation);
  
  // Determinar se está aprovado (nota >= 6.0) - usado em vários lugares
  const isApproved = notaPrevista !== undefined && notaPrevista >= 6.0;
  
  // Gera título e mensagem principal
  const titles = [
    'O que mais influenciou sua nota',
    'Principais fatores da sua predição',
    'Análise do seu desempenho',
    'Fatores que impactaram seu resultado',
    'O que determinou sua nota prevista',
    'Análise dos principais indicadores',
  ];
  let title = titles[Math.floor(Math.random() * titles.length)];
  let message = '';
  
  if (features.length > 0) {
    const topFeature = features[0];
    const featureValue = topFeature.value;
    const isNumeric = typeof featureValue === 'number';
    
    // Array de mensagens variadas para tornar o feedback mais amigável
    const article = getCorrectArticle(topFeature.feature);
    const featureLower = topFeature.feature.toLowerCase();
    const positiveMessages = [
      `Parabéns! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está contribuindo muito para seu sucesso! 🎉`,
      `Ótimo trabalho! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está fazendo toda a diferença! 👏`,
      `Excelente! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te ajudando a alcançar bons resultados! ⭐`,
      `Que bom! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um grande aliado no seu aprendizado! 💪`,
      `Incrível! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um diferencial positivo! 🌟`,
      `Fantástico! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te colocando no caminho certo! 🚀`,
      `Muito bem! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um ponto forte! 💎`,
    ];
    
    const negativeMessages = [
      `Sua nota foi impactada principalmente por ${topFeature.feature.toLowerCase()}. `,
      `O principal fator que está afetando sua nota é ${topFeature.feature.toLowerCase()}. `,
      `Identificamos que ${topFeature.feature.toLowerCase()} está sendo o maior desafio para seu desempenho. `,
      `Analisando seus dados, ${topFeature.feature.toLowerCase()} aparece como o ponto que mais precisa de atenção. `,
      `Entre os fatores analisados, ${topFeature.feature.toLowerCase()} é o que mais está influenciando negativamente seu resultado. `,
      `Seu desempenho está sendo limitado especialmente por ${topFeature.feature.toLowerCase()}. `,
    ];
    
    if (topFeature.influence === 'negativa') {
      // Escolhe uma mensagem negativa aleatória
      // Se a nota prevista for baixa (< 6.0), usar tom mais crítico
      const precisaMensagemCritica = notaPrevista !== undefined && notaPrevista < 6.0;
      
      if (precisaMensagemCritica) {
        // Mensagens críticas quando nota < 6.0
        const criticalNegativeMessages = [
          `⚠️ CRÍTICO: Sua nota foi IMPACTADA GRAVEMENTE por ${topFeature.feature.toLowerCase()}. `,
          `🚨 URGENTE: O principal fator que está AFETANDO CRITICAMENTE sua nota é ${topFeature.feature.toLowerCase()}. `,
          `⚠️ ALERTA: Identificamos que ${topFeature.feature.toLowerCase()} está sendo um OBSTÁCULO CRÍTICO para seu desempenho. `,
          `🚨 ATENÇÃO: Analisando seus dados, ${topFeature.feature.toLowerCase()} aparece como o ponto CRÍTICO que precisa de ação IMEDIATA. `,
          `⚠️ SITUAÇÃO CRÍTICA: Entre os fatores analisados, ${topFeature.feature.toLowerCase()} é o que mais está COMPROMETENDO seu resultado. `,
          `🚨 URGENTE: Seu desempenho está sendo LIMITADO CRITICAMENTE por ${topFeature.feature.toLowerCase()}. `,
        ];
        message = criticalNegativeMessages[Math.floor(Math.random() * criticalNegativeMessages.length)];
      } else {
        const randomNegativeMsg = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
        message = randomNegativeMsg;
      }
      
      if (topFeature.feature === 'Horas de Estudo') {
        // O valor vem em horas semanais do ML
        const weeklyHours = isNumeric ? featureValue : 0;
        const dailyHours = weeklyHours / 7;
        
        const studyMessages = {
          veryLow: [
            `Com apenas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está estudando menos do que o ideal. Que tal aumentar para pelo menos 28-35 horas semanais?`,
            `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) é muito pouco para alcançar seus objetivos. Tente dedicar mais tempo aos estudos!`,
            `Seu tempo de estudo atual (${weeklyHours}h semanais, ${dailyHours.toFixed(1)}h por dia) pode estar limitando seu potencial. Aumentar para 28-35 horas semanais faria uma grande diferença!`,
            `Com ${weeklyHours} horas semanais, você está abaixo do recomendado. Investir mais tempo nos estudos é essencial para ver resultados melhores!`,
            `Seu tempo de estudo (${weeklyHours}h semanais, ${dailyHours.toFixed(1)}h por dia) precisa aumentar. Mais horas dedicadas = mais conhecimento adquirido!`,
            `Apenas ${weeklyHours} horas semanais não são suficientes. Aumentar para 28-35 horas fará uma diferença significativa no seu desempenho!`,
          ],
          low: [
            `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) são um bom começo, mas ainda podem ser insuficientes. Tente aumentar para pelo menos 28-35 horas semanais para ver melhorias significativas!`,
            `Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está no caminho certo, mas pode melhorar! Aumentar para 28-35 horas semanais te ajudaria muito.`,
            `Sua dedicação de ${weeklyHours} horas semanais está boa, mas pode ser otimizada. Mais tempo de estudo = mais oportunidades de aprendizado!`,
            `Com ${weeklyHours} horas semanais, você está quase lá! Aumentar um pouco mais te colocará na faixa ideal de estudo!`,
          ],
          high: [
            `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) é bastante tempo! Mas lembre-se: qualidade é mais importante que quantidade. Considere equilibrar melhor com descanso.`,
            `Você está dedicando ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) aos estudos - isso é muito! Não esqueça de descansar, pois o cansaço pode prejudicar seu aprendizado.`,
            `Com ${weeklyHours} horas semanais, você está estudando demais! Equilibrar com descanso é essencial - qualidade supera quantidade!`,
            `Suas ${weeklyHours} horas semanais são excessivas. Reduzir um pouco e focar na qualidade do estudo será mais eficaz!`,
          ],
          medium: [
            `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) podem não estar sendo aproveitadas da melhor forma. Foque na qualidade do estudo e em técnicas eficientes!`,
            `Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você tem potencial para melhorar! Tente técnicas de estudo mais ativas e eficientes.`,
            `Sua rotina de ${weeklyHours} horas semanais está boa, mas pode ser otimizada. Técnicas de estudo eficientes valem mais que horas extras!`,
            `Com ${weeklyHours} horas semanais, você está no caminho certo! Focar em métodos de estudo mais eficientes fará toda diferença!`,
          ],
        };
        
        if (isNumeric && weeklyHours >= 50) {
          message += studyMessages.high[Math.floor(Math.random() * studyMessages.high.length)];
        } else if (isNumeric && weeklyHours < 20) {
          if (precisaMensagemCritica) {
            message += `⚠️ CRÍTICO: Com apenas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está em RISCO DE REPROVAÇÃO! É URGENTE aumentar para pelo menos 35-42 horas semanais IMEDIATAMENTE!`;
          } else {
            message += studyMessages.veryLow[Math.floor(Math.random() * studyMessages.veryLow.length)];
          }
        } else if (isNumeric && weeklyHours < 28) {
          if (precisaMensagemCritica) {
            message += `🚨 URGENTE: Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) são INSUFICIENTES! Você precisa aumentar para pelo menos 35-42 horas semanais AGORA para evitar reprovação!`;
          } else {
            message += studyMessages.low[Math.floor(Math.random() * studyMessages.low.length)];
          }
        } else {
          if (precisaMensagemCritica) {
            message += `⚠️ ATENÇÃO: Suas ${weeklyHours} horas semanais precisam ser OTIMIZADAS com urgência! Foque em qualidade e aumente para 35-42 horas semanais para melhorar seu desempenho crítico!`;
          } else {
            message += studyMessages.medium[Math.floor(Math.random() * studyMessages.medium.length)];
          }
        }
      } else if (topFeature.feature === 'Frequência às Aulas') {
        const attendanceMessages = {
          veryLow: [
            `Sua frequência de ${featureValue}% está muito abaixo do ideal. Comparecer às aulas é fundamental para não perder conteúdo importante. Tente aumentar para pelo menos 80%!`,
            `Com ${featureValue}% de frequência, você está perdendo muito conteúdo. Cada aula perdida é uma oportunidade de aprendizado que não volta. Vamos melhorar isso?`,
            `Sua frequência de ${featureValue}% precisa de atenção urgente. Estar presente nas aulas é essencial para o sucesso acadêmico. Que tal se comprometer a comparecer mais?`,
            `Com apenas ${featureValue}% de frequência, você está perdendo oportunidades valiosas de aprendizado. Cada aula conta - vamos aumentar essa porcentagem!`,
          ],
          low: [
            `Sua frequência de ${featureValue}% pode estar afetando seu aprendizado. Tente aumentar para pelo menos 80% para não perder conteúdo essencial.`,
            `Com ${featureValue}% de frequência, há espaço para melhorar. Comparecer mais às aulas te ajudará a entender melhor o conteúdo!`,
            `Sua frequência de ${featureValue}% está boa, mas pode melhorar. Aumentar para 80%+ fará uma diferença significativa no seu desempenho!`,
            `Com ${featureValue}% de frequência, você está no caminho certo, mas ainda pode otimizar. Mais presença = mais aprendizado!`,
          ],
        };
        
        if (isNumeric && featureValue < 70) {
          if (precisaMensagemCritica) {
            message += `🚨 CRÍTICO: Sua frequência de ${featureValue}% está EM RISCO! Comparecer às aulas é FUNDAMENTAL para evitar reprovação. Você PRECISA aumentar para pelo menos 80% IMEDIATAMENTE!`;
          } else {
            message += attendanceMessages.veryLow[Math.floor(Math.random() * attendanceMessages.veryLow.length)];
          }
        } else {
          if (precisaMensagemCritica) {
            message += `⚠️ URGENTE: Sua frequência de ${featureValue}% precisa melhorar! Aumente para pelo menos 80% para evitar reprovação!`;
          } else {
            message += attendanceMessages.low[Math.floor(Math.random() * attendanceMessages.low.length)];
          }
        }
      } else if (topFeature.feature === 'Horas de Sono') {
        const sleepMessages = {
          veryLow: [
            `Dormir apenas ${featureValue} horas por noite não é suficiente! O sono é essencial para fixar o aprendizado. Tente dormir pelo menos 7-8 horas para melhorar sua concentração.`,
            `Com ${featureValue} horas de sono por noite, seu cérebro não tem tempo suficiente para descansar. Um bom sono (7-8h) faz toda a diferença no aprendizado!`,
            `Sua rotina de ${featureValue} horas de sono está comprometendo seu desempenho. O cérebro precisa de 7-8 horas para processar e fixar o que você aprendeu!`,
            `Apenas ${featureValue} horas de sono não são suficientes para um aprendizado eficaz. Priorize o descanso - seu cérebro agradece!`,
          ],
          veryHigh: [
            `Dormir ${featureValue} horas por noite pode estar reduzindo seu tempo disponível para estudos. Tente equilibrar: 7-8 horas de sono são ideais!`,
            `${featureValue} horas de sono por noite é bastante! Considere reduzir um pouco para ter mais tempo de estudo, mantendo 7-8 horas que são suficientes.`,
            `Com ${featureValue} horas de sono, você pode estar dormindo demais. O ideal é 7-8 horas - isso te dará mais tempo para os estudos sem comprometer o descanso!`,
            `${featureValue} horas de sono é excessivo. Ajustar para 7-8 horas otimizará seu tempo e ainda garantirá descanso adequado!`,
          ],
          medium: [
            `Suas ${featureValue} horas de sono podem estar impactando seu desempenho. Uma rotina de sono regular e de qualidade (7-8h) é fundamental!`,
            `Com ${featureValue} horas de sono, tente estabelecer uma rotina mais consistente. O sono de qualidade melhora muito a concentração!`,
            `Sua rotina de ${featureValue} horas está próxima do ideal, mas pode ser otimizada. 7-8 horas de sono regular farão diferença!`,
            `Com ${featureValue} horas de sono, você está quase lá! Ajustar para 7-8 horas regulares melhorará sua capacidade de aprendizado!`,
          ],
        };
        
        if (isNumeric && featureValue < 6) {
          message += sleepMessages.veryLow[Math.floor(Math.random() * sleepMessages.veryLow.length)];
        } else if (isNumeric && featureValue > 10) {
          message += sleepMessages.veryHigh[Math.floor(Math.random() * sleepMessages.veryHigh.length)];
        } else {
          message += sleepMessages.medium[Math.floor(Math.random() * sleepMessages.medium.length)];
        }
      } else if (topFeature.feature === 'Nível de Motivação') {
        const motivationMessages = [
          `Seu nível de motivação (${featureValue}/10) está baixo e isso pode estar afetando seu desempenho. Que tal encontrar atividades que te inspirem mais?`,
          `Com motivação em ${featureValue}/10, é difícil manter o foco. Procure formas de tornar os estudos mais interessantes e recompensadores!`,
          `Sua motivação (${featureValue}/10) pode estar limitando seu potencial. Estabeleça metas claras e celebre cada conquista - isso ajuda muito!`,
          `Motivação em ${featureValue}/10 precisa de um impulso! Encontre seu "porquê" - o que te move a estudar? Isso fará toda diferença!`,
          `Com ${featureValue}/10 de motivação, você pode estar perdendo oportunidades. Que tal criar um sistema de recompensas para seus estudos?`,
          `Sua motivação (${featureValue}/10) está baixa, mas pode melhorar! Conecte seus estudos com seus objetivos pessoais e veja a diferença!`,
        ];
        message += motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      } else if (topFeature.feature === 'Notas Anteriores') {
        const previousScoresMessages = [
          `Suas notas anteriores (${featureValue}) indicam que há espaço para crescimento. Não desanime - cada novo semestre é uma nova oportunidade!`,
          `Com notas anteriores de ${featureValue}, você tem potencial para melhorar muito. Foque nos pontos que mais impactam seu desempenho!`,
          `Notas anteriores de ${featureValue} não definem seu futuro! Use isso como ponto de partida para superar suas próprias expectativas!`,
          `Com ${featureValue} de média anterior, você tem uma base para construir. Cada pequena melhoria te aproxima dos seus objetivos!`,
          `Suas notas anteriores (${featureValue}) mostram que há potencial. Agora é hora de aplicar estratégias diferentes e ver resultados melhores!`,
        ];
        message += previousScoresMessages[Math.floor(Math.random() * previousScoresMessages.length)];
      } else {
        // Mensagem genérica mas contextual e variada
        // Se a nota prevista for baixa (< 6.0), usar mensagens mais críticas
        const valueStr = isNumeric ? featureValue.toString() : featureValue;
        const notaPrevista = typeof topFeature.value === 'number' && topFeature.feature === 'Notas Anteriores' 
          ? topFeature.value 
          : null;
        
        // Verificar se precisa de mensagem crítica (nota < 6.0)
        const precisaMensagemCritica = notaPrevista !== null && notaPrevista < 6.0;
        
        const genericMessages = precisaMensagemCritica ? [
          `⚠️ CRÍTICO: Seu ${topFeature.feature.toLowerCase()} (${valueStr}) está impactando GRAVEMENTE seu desempenho. Você precisa tomar ações IMEDIATAS para melhorar isso!`,
          `🚨 URGENTE: O ${topFeature.feature.toLowerCase()} (${valueStr}) está sendo um OBSTÁCULO CRÍTICO. Não ignore isso - busque ajuda e melhore AGORA!`,
          `⚠️ ALERTA: Identificamos que seu ${topFeature.feature.toLowerCase()} (${valueStr}) está em situação CRÍTICA. Trabalhar nisso é URGENTE para evitar reprovação!`,
          `🚨 ATENÇÃO: O ${topFeature.feature.toLowerCase()} (${valueStr}) está em estado CRÍTICO. Você precisa investir tempo e esforço IMEDIATOS nisso!`,
        ] : [
          `Seu ${topFeature.feature.toLowerCase()} (${valueStr}) está impactando negativamente seu desempenho. Focar em melhorar isso pode fazer uma grande diferença!`,
          `O ${topFeature.feature.toLowerCase()} (${valueStr}) está sendo um desafio. Mas não se preocupe - com dedicação, você pode melhorar!`,
          `Identificamos que seu ${topFeature.feature.toLowerCase()} (${valueStr}) precisa de atenção. Trabalhar nisso te ajudará a alcançar melhores resultados!`,
          `Analisando seus dados, o ${topFeature.feature.toLowerCase()} (${valueStr}) aparece como uma área de melhoria importante. Invista tempo nisso!`,
          `Seu ${topFeature.feature.toLowerCase()} (${valueStr}) está abaixo do ideal. Com foco e esforço, você pode transformar isso em um ponto forte!`,
          `O ${topFeature.feature.toLowerCase()} (${valueStr}) está limitando seu potencial. Que tal criar um plano para melhorar esse aspecto?`,
          `Notamos que seu ${topFeature.feature.toLowerCase()} (${valueStr}) precisa de desenvolvimento. Cada pequeno progresso aqui fará diferença!`,
        ];
        message += genericMessages[Math.floor(Math.random() * genericMessages.length)];
      }
    } else {
      // Influência positiva - mensagens mais encorajadoras
      // Se nota >= 60, reforçar pontos positivos e destacar o que está funcionando
      if (isApproved) {
        // Mensagens que destacam os pontos positivos e encorajam melhorias
        const approvedPositiveMessages = [
          `🎉 Parabéns pela aprovação! ${topFeature.feature} está sendo um grande diferencial no seu sucesso! Continue mantendo esse ponto forte e busque melhorias em outras áreas para alcançar notas ainda maiores!`,
          `✅ Excelente! Você está aprovado e ${topFeature.feature.toLowerCase()} é um dos fatores que está te levando ao sucesso! Continue reforçando esse aspecto positivo e identifique oportunidades de crescimento!`,
          `🌟 Muito bem! Sua aprovação mostra que ${topFeature.feature.toLowerCase()} está funcionando muito bem! Mantenha esse padrão e desafie-se a melhorar em outras áreas também!`,
          `💪 Parabéns! ${topFeature.feature} está contribuindo significativamente para sua aprovação! Continue valorizando esse ponto forte e trabalhe para elevar ainda mais seu desempenho!`,
          `🎯 Ótimo trabalho! Você está aprovado e ${topFeature.feature.toLowerCase()} é um dos seus pontos fortes! Continue mantendo esse hábito positivo e busque melhorias contínuas!`,
        ];
        message = approvedPositiveMessages[Math.floor(Math.random() * approvedPositiveMessages.length)];
      } else {
        const randomPositiveMsg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
        message = randomPositiveMsg;
      }
      
      if (topFeature.feature === 'Horas de Estudo' && isNumeric) {
        const weeklyHours = featureValue;
        const dailyHours = weeklyHours / 7;
        const studyPositiveMessages = isApproved ? [
          `🎉 Parabéns pela aprovação! Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) foi fundamental para seu sucesso! Continue mantendo essa dedicação e considere desafiar-se com exercícios mais complexos para elevar ainda mais sua nota! 💪`,
          `✅ Aprovado! Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) de estudo estão rendendo frutos! Parabéns pela disciplina! Continue assim e busque identificar outras áreas onde pode melhorar para alcançar notas ainda maiores! 🌟`,
          `🌟 Excelente! Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você alcançou a aprovação! Continue mantendo esse comprometimento e explore técnicas de estudo mais avançadas para potencializar ainda mais seu aprendizado! 🎯`,
          `💪 Incrível! Sua dedicação de ${weeklyHours} horas semanais te levou à aprovação! Mantenha esse ritmo e procure participar de atividades extras e grupos de estudo para aprofundar seus conhecimentos! 🚀`,
          `⭐ Fantástico! Com ${weeklyHours} horas semanais, você está aprovado e investindo no seu futuro! Continue assim e estabeleça metas progressivas para continuar melhorando seu desempenho! 💎`,
        ] : [
          `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) está te levando ao sucesso! Continue mantendo essa dedicação! 💪`,
          `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) de estudo estão rendendo frutos! Parabéns pela disciplina! 🌟`,
          `Excelente! Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está no caminho certo! Continue assim! 🎯`,
          `Incrível! Sua dedicação de ${weeklyHours} horas semanais está fazendo toda diferença! Mantenha esse ritmo! 🚀`,
          `Fantástico! Com ${weeklyHours} horas semanais, você está investindo no seu futuro! Continue assim! ⭐`,
          `Muito bem! Suas ${weeklyHours} horas de estudo estão sendo um diferencial positivo! 💎`,
        ];
        message = studyPositiveMessages[Math.floor(Math.random() * studyPositiveMessages.length)];
      } else if (topFeature.feature === 'Frequência às Aulas' && isNumeric) {
        const attendancePositiveMessages = isApproved ? [
          `🎉 Parabéns pela aprovação! Sua frequência de ${featureValue}% foi essencial para seu sucesso! Comparecer às aulas regularmente é um dos segredos do sucesso! Continue mantendo essa frequência e participe ainda mais ativamente das discussões para elevar seu desempenho! 👏`,
          `✅ Aprovado! Com ${featureValue}% de frequência, você aproveitou ao máximo as aulas e alcançou a aprovação! Continue assim e busque participar de atividades extras e grupos de estudo para aprofundar ainda mais seus conhecimentos! ⭐`,
          `🌟 Parabéns! Sua frequência de ${featureValue}% mostra seu comprometimento e te levou à aprovação! Continue mantendo essa dedicação e procure desafiar-se com exercícios mais complexos para melhorar ainda mais! 🎉`,
          `💪 Incrível! Com ${featureValue}% de frequência, você está aprovado! Sua presença faz toda diferença! Continue assim e explore materiais complementares para expandir seu aprendizado! 🌟`,
          `⭐ Fantástico! Sua frequência de ${featureValue}% é um exemplo de dedicação que resultou em aprovação! Mantenha esse padrão e estabeleça metas progressivas para continuar melhorando! 💪`,
          `🚀 Excelente! ${featureValue}% de frequência te levou à aprovação! Continue valorizando cada momento de aprendizado e busque feedback dos professores sobre como potencializar ainda mais seu desempenho! 🎯`,
        ] : [
          `Sua frequência de ${featureValue}% está excelente! Comparecer às aulas regularmente é um dos segredos do sucesso! 👏`,
          `Ótimo! Com ${featureValue}% de frequência, você está aproveitando ao máximo as aulas. Continue assim! ⭐`,
          `Parabéns! Sua frequência de ${featureValue}% mostra seu comprometimento. Isso está fazendo toda a diferença! 🎉`,
          `Incrível! Com ${featureValue}% de frequência, você está no caminho certo! Sua presença faz toda diferença! 🌟`,
          `Fantástico! Sua frequência de ${featureValue}% é um exemplo de dedicação! Continue assim! 💪`,
          `Excelente! ${featureValue}% de frequência mostra que você valoriza cada momento de aprendizado! 🚀`,
        ];
        message = attendancePositiveMessages[Math.floor(Math.random() * attendancePositiveMessages.length)];
      } else if (topFeature.feature === 'Acesso a Recursos' || topFeature.feature === 'Qualidade do Professor') {
        const resourceMessages = [
          `Ter ${topFeature.feature.toLowerCase()} de qualidade está te ajudando muito! Continue aproveitando bem esses recursos! 📚`,
          `Ótimo! Seu ${topFeature.feature.toLowerCase()} está contribuindo positivamente para seu aprendizado! 💡`,
          `Incrível! Seu ${topFeature.feature.toLowerCase()} está sendo um diferencial positivo! Aproveite ao máximo! 🌟`,
          `Fantástico! Ter ${topFeature.feature.toLowerCase()} de qualidade é uma grande vantagem! Continue valorizando! 🚀`,
          `Excelente! Seu ${topFeature.feature.toLowerCase()} está te dando suporte valioso! Mantenha esse padrão! ⭐`,
        ];
        message = resourceMessages[Math.floor(Math.random() * resourceMessages.length)];
      } else if (topFeature.feature === 'Envolvimento dos Pais' || topFeature.feature === 'Nível de Motivação') {
        const supportMessages = [
          `Ter ${topFeature.feature.toLowerCase()} está sendo um grande apoio no seu aprendizado! Continue valorizando isso! 🤝`,
          `Excelente! Seu ${topFeature.feature.toLowerCase()} está te dando a base necessária para o sucesso! 🌱`,
          `Incrível! Seu ${topFeature.feature.toLowerCase()} está sendo um pilar importante! Continue cultivando isso! 💪`,
          `Fantástico! Ter ${topFeature.feature.toLowerCase()} é uma grande bênção! Aproveite esse suporte! 🌟`,
          `Muito bem! Seu ${topFeature.feature.toLowerCase()} está te fortalecendo! Isso faz toda diferença! 🚀`,
        ];
        message = supportMessages[Math.floor(Math.random() * supportMessages.length)];
      } else {
        const article = getCorrectArticle(topFeature.feature);
        const featureLower = topFeature.feature.toLowerCase();
        const genericPositiveMessages = isApproved ? [
          `🎉 Parabéns pela aprovação! Continue mantendo ${article} ${featureLower} - ele está fazendo toda a diferença no seu sucesso! Busque melhorias em outras áreas para elevar ainda mais sua nota! ✨`,
          `✅ Aprovado! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te ajudando a alcançar seus objetivos! Continue reforçando esse ponto forte e identifique oportunidades de crescimento! 🎊`,
          `🌟 Ótimo trabalho! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está valendo a pena e te levou à aprovação! Continue investindo nesse aspecto e desafie-se a melhorar em outras áreas também! 💎`,
          `💪 Excelente! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um diferencial positivo no seu sucesso! Continue assim e estabeleça metas progressivas para continuar melhorando! 🌟`,
          `🚀 Que incrível! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te colocando à frente e resultou em aprovação! Mantenha esse padrão e explore técnicas mais avançadas para potencializar seu aprendizado! 🎯`,
          `⭐ Fantástico! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um ponto forte que te levou à aprovação! Continue valorizando isso e busque feedback para melhorias contínuas! 💪`,
          `🎯 Muito bem! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está no caminho certo e contribuiu para sua aprovação! Continue mantendo esse hábito positivo e procure participar de atividades extras para aprofundar conhecimentos! 🌱`,
        ] : [
          `Continue mantendo esse bom hábito! Ele está fazendo toda a diferença! ✨`,
          `Parabéns! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te ajudando a alcançar seus objetivos! 🎊`,
          `Ótimo trabalho! Continue investindo nesse aspecto - está valendo a pena! 💎`,
          `Excelente! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um diferencial positivo! Continue assim! 🌟`,
          `Que incrível! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te colocando à frente! Mantenha esse padrão! 🚀`,
          `Fantástico! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um ponto forte! Isso está rendendo frutos! 💪`,
          `Muito bem! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está no caminho certo! Continue valorizando isso! ⭐`,
        ];
        message = genericPositiveMessages[Math.floor(Math.random() * genericPositiveMessages.length)];
      }
    }
    
    if (features.length > 1) {
      const otherFeatures = features.slice(1, 3).map(f => f.feature.toLowerCase()).join(', ');
      if (isApproved) {
        message += ` Outros fatores que também estão contribuindo para seu sucesso: ${otherFeatures}. Continue mantendo esses pontos fortes!`;
      } else {
        message += ` Outros fatores importantes: ${otherFeatures}.`;
      }
    }
  } else {
    // Fallback se não conseguir parsear - melhorar formatação
    const notaFormatada = notaPrevista?.toFixed(1) || 'calculada';
    const predictedScore = notaPrevista !== undefined ? notaPrevista * 10 : null;
    
    // Tentar extrair informações da explicação se estiver no formato antigo
    const explanationLower = explanation.toLowerCase();
    let statusInfo = '';
    let categoriaInfo = '';
    
    // Verificar se a explicação contém informações de status e categoria
    if (explanationLower.includes('status:') || explanationLower.includes('categoria:')) {
      // Se já tem informações formatadas, usar a explicação melhorada do backend
      message = explanation;
    } else {
      // Criar mensagem amigável baseada na nota
      if (predictedScore !== null && predictedScore >= 60) {
        const categoria = classificacao || 'bom';
        message = `Parabéns! Sua nota prevista é ${notaFormatada}/10 (${predictedScore.toFixed(1)} pontos), o que indica que você está aprovado. Seu desempenho está classificado como ${categoria.toLowerCase()}. Continue mantendo seus bons hábitos de estudo!`;
      } else if (predictedScore !== null && predictedScore < 60) {
        const categoria = classificacao || 'insuficiente';
        message = `Sua nota prevista é ${notaFormatada}/10 (${predictedScore.toFixed(1)} pontos), o que indica que você precisa melhorar. Seu desempenho está classificado como ${categoria.toLowerCase()}. É importante focar em melhorar seus hábitos de estudo para alcançar a aprovação.`;
      } else {
        message = `Sua nota prevista é ${notaFormatada}. ${explanation.substring(0, 200)}`;
      }
    }
  }
  
  const suggestions = generateSuggestions(features, 'performance');
  
  // Se nota é aprovada (>= 6.0), adicionar sugestões de melhoria construtivas
  if (isApproved && suggestions.length < 5) {
    const improvementSuggestions = [
      'Continue mantendo seus pontos fortes - eles estão te levando ao sucesso!',
      'Identifique áreas de crescimento para alcançar notas ainda maiores',
      'Desafie-se com exercícios mais complexos para elevar seu desempenho',
      'Mantenha a consistência nos seus hábitos de estudo que estão funcionando',
      'Participe de atividades extras e grupos de estudo para aprofundar conhecimentos',
      'Estabeleça metas progressivas para continuar melhorando',
      'Busque feedback dos professores sobre como potencializar ainda mais seu aprendizado',
      'Explore materiais complementares para expandir seu conhecimento',
      'Continue revisando regularmente - a revisão constante está te ajudando',
      'Mantenha sua motivação alta e celebre suas conquistas enquanto busca melhorias',
    ];
    
    // Adicionar sugestões de melhoria até ter pelo menos 5 sugestões
    const sugestoesAdicionais = improvementSuggestions.slice(0, Math.max(0, 5 - suggestions.length));
    suggestions.push(...sugestoesAdicionais);
  }
  
  // Se nota é baixa (< 6) e não há sugestões suficientes, adicionar sugestões críticas
  const precisaMensagemCritica = notaPrevista !== undefined && notaPrevista < 6.0;
  if (precisaMensagemCritica && suggestions.length < 3) {
    const sugestoesCriticas = [
      'Aumente suas horas de estudo diárias para pelo menos 3-4 horas',
      'Compareça a TODAS as aulas - frequência é fundamental para o sucesso',
      'Organize um cronograma de estudos rigoroso e siga-o diariamente',
      'Busque ajuda dos professores e monitores IMEDIATAMENTE',
      'Participe de grupos de estudo e atividades complementares',
      'Revise o conteúdo das aulas no mesmo dia que foram ministradas',
      'Faça exercícios práticos regularmente para fixar o aprendizado',
      'Mantenha uma rotina de sono adequada (7-8 horas por noite)',
      'Elimine distrações durante o tempo de estudo',
      'Estabeleça metas diárias e semanais claras e mensuráveis'
    ];
    
    // Adicionar sugestões críticas até ter pelo menos 5 sugestões
    const sugestoesAdicionais = sugestoesCriticas.slice(0, Math.max(0, 5 - suggestions.length));
    suggestions.push(...sugestoesAdicionais);
  }
  
  return {
    title,
    message,
    features: features.slice(0, 3), // Top 3 features
    suggestions: suggestions.slice(0, 8), // Limitar a 8 sugestões para não sobrecarregar
  };
}

/**
 * Gera feedback personalizado para predição de evasão
 */
export function generateDropoutFeedback(
  explanation: string,
  probabilidade?: number,
  classificacao?: string
): FeedbackMessage {
  // Se não houver explicação, gera feedback genérico baseado na probabilidade
  if (!explanation || explanation.trim() === '' || explanation === 'Sem explicação disponível') {
    const prob = probabilidade || 0;
    let title = 'Feedback sobre seu Risco de Evasão';
    let message = '';
    
    const highRiskMessages = [
      'Seu risco de evasão é alto. ⚠️ É importante focar em melhorar seu engajamento com as atividades escolares. Você consegue superar isso!',
      'Identificamos um risco de evasão elevado. 💪 Mas não desista! Com dedicação e apoio, você pode reverter essa situação.',
      'Seu risco de evasão está alto, mas isso não é definitivo! 🌱 Foque em se engajar mais com os estudos e atividades escolares.',
    ];
    
    const mediumRiskMessages = [
      'Seu risco de evasão é médio. 💡 Com alguns ajustes e mais engajamento, você pode reduzir esse risco significativamente!',
      'Há um risco moderado de evasão identificado. 🎯 Mas com foco e dedicação, você pode melhorar sua situação!',
      'Seu risco de evasão está na média. ✨ Trabalhe nos pontos que mais impactam seu engajamento para reduzir esse risco!',
    ];
    
    const lowRiskMessages = [
      'Ótima notícia! Seu risco de evasão é baixo! 🎉 Continue mantendo seu bom engajamento e dedicação!',
      'Parabéns! Seu risco de evasão está baixo! ⭐ Você está no caminho certo - continue assim!',
      'Excelente! Seu risco de evasão é baixo! 👏 Seu engajamento está fazendo toda a diferença!',
    ];
    
    if (prob >= 0.7) {
      message = highRiskMessages[Math.floor(Math.random() * highRiskMessages.length)];
    } else if (prob >= 0.4) {
      message = mediumRiskMessages[Math.floor(Math.random() * mediumRiskMessages.length)];
    } else {
      message = lowRiskMessages[Math.floor(Math.random() * lowRiskMessages.length)];
    }
    
    const genericSuggestions = [
      [
        'Aumente sua participação nas aulas - faça perguntas e interaja mais',
        'Acesse mais materiais de estudo disponíveis na plataforma',
        'Mantenha uma boa frequência - comparecer às aulas é fundamental',
      ],
      [
        'Participe mais de discussões e fóruns com colegas e professores',
        'Estabeleça metas claras e acompanhe seu progresso',
        'Procure ajuda quando tiver dificuldades - não hesite em pedir apoio',
      ],
      [
        'Mantenha-se engajado com as atividades escolares regularmente',
        'Organize seu tempo para equilibrar estudos e descanso',
        'Conecte-se com colegas e professores para se sentir mais parte da comunidade',
      ],
    ];
    
    return {
      title,
      message,
      features: [],
      suggestions: genericSuggestions[Math.floor(Math.random() * genericSuggestions.length)],
    };
  }
  
  // Parse da explicação
  const features = parseDropoutExplanation(explanation);
  
  // Gera título e mensagem principal
  const titles = [
    'O que mais influencia seu risco de evasão',
    'Principais fatores do seu risco',
    'Análise do seu risco de evasão',
    'Fatores que impactam sua permanência',
    'O que determina seu risco',
    'Análise dos indicadores de evasão',
  ];
  let title = titles[Math.floor(Math.random() * titles.length)];
  let message = '';
  
  if (features.length > 0) {
    const topFeature = features[0];
    
    const negativeRiskMessages = [
      `Seu risco de evasão é aumentado principalmente por ${topFeature.feature.toLowerCase()}. `,
      `O principal fator que está elevando seu risco de evasão é ${topFeature.feature.toLowerCase()}. `,
      `Identificamos que ${topFeature.feature.toLowerCase()} está sendo o maior desafio para sua permanência. `,
      `Analisando seus dados, ${topFeature.feature.toLowerCase()} aparece como o ponto crítico que precisa de atenção. `,
      `Entre os fatores analisados, ${topFeature.feature.toLowerCase()} é o que mais está elevando seu risco. `,
      `Seu risco está sendo influenciado especialmente por ${topFeature.feature.toLowerCase()}. `,
      `O ${topFeature.feature.toLowerCase()} está sendo um obstáculo para sua permanência na escola. `,
    ];
    
    const article = getCorrectArticle(topFeature.feature);
    const featureLower = topFeature.feature.toLowerCase();
    const positiveRiskMessages = [
      `Ótima notícia! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está reduzindo seu risco de evasão! 🎉`,
      `Parabéns! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te ajudando a permanecer engajado! 👏`,
      `Excelente! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um grande aliado na sua permanência! ⭐`,
      `Incrível! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um diferencial positivo! Continue assim! 🌟`,
      `Fantástico! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te mantendo conectado com os estudos! 🚀`,
      `Muito bem! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está sendo um ponto forte na sua jornada! 💎`,
      `Que bom! ${article.charAt(0).toUpperCase() + article.slice(1)} ${featureLower} está te ajudando a se manter engajado! 💪`,
    ];
    
    if (topFeature.influence === 'negativa') {
      message = negativeRiskMessages[Math.floor(Math.random() * negativeRiskMessages.length)];
      
      if (topFeature.feature === 'Faltas Escolares') {
        const absenceMessages = [
          'Muitas faltas podem indicar desengajamento. Tente reduzir suas ausências - cada aula é importante!',
          'As faltas estão aumentando seu risco. Comparecer mais às aulas te ajudará a se sentir mais conectado com os estudos.',
          'Reduzir suas faltas é fundamental. Quando você falta, perde conteúdo e conexão com a turma. Vamos melhorar isso?',
          'Cada falta é uma oportunidade perdida. Comparecer regularmente te mantém no ritmo e engajado com o aprendizado!',
          'As ausências estão impactando seu engajamento. Estar presente nas aulas é o primeiro passo para o sucesso!',
          'Reduzir faltas é essencial. A presença regular cria rotina, conexão e melhora significativamente o desempenho!',
        ];
        message += absenceMessages[Math.floor(Math.random() * absenceMessages.length)];
      } else if (topFeature.feature === 'Participação em Aula' || topFeature.feature === 'RaisedHands' || topFeature.feature === 'raisedhands') {
        const participationValue = typeof topFeature.value === 'number' ? topFeature.value : 0;
        const participationMessages = [
          `Com apenas ${participationValue} participações, você está muito abaixo do ideal. Que tal se envolver mais? Fazer perguntas e responder ajuda muito!`,
          `Sua participação de ${participationValue} vezes pode ser melhorada. Participar mais das aulas te ajudará a se sentir mais engajado. Não tenha medo de levantar a mão e interagir!`,
          `A participação ativa nas aulas faz toda a diferença. Com ${participationValue} participações, tente fazer pelo menos uma pergunta ou comentário por aula!`,
          `Sua participação de ${participationValue} vezes é fundamental! Interagir nas aulas não só ajuda no aprendizado, mas também te mantém conectado!`,
          `Participar ativamente transforma a experiência de aprendizado. Com ${participationValue} participações, que tal começar com uma pergunta por dia?`,
          `A participação é uma via de mão dupla - você aprende mais e se sente mais parte da turma. Com ${participationValue} participações, vamos aumentar isso!`,
        ];
        message += participationMessages[Math.floor(Math.random() * participationMessages.length)];
      } else if (topFeature.feature === 'Materiais Acessados' || topFeature.feature === 'VisITedResources' || topFeature.feature === 'VisitedResources') {
        const materialsValue = typeof topFeature.value === 'number' ? topFeature.value : 0;
        const materialsMessages = [
          `Com apenas ${materialsValue} materiais acessados, você está perdendo oportunidades de aprendizado. Explore mais os recursos disponíveis - há muito conteúdo interessante!`,
          `Os materiais de estudo estão aí para te ajudar! Com ${materialsValue} acessos, tente aumentar para pelo menos 20-30 materiais para melhorar seu aprendizado.`,
          `Que tal explorar mais os materiais disponíveis? Com ${materialsValue} acessos, quanto mais você acessa, mais opções de aprendizado você tem!`,
          `Os materiais são ferramentas poderosas! Com ${materialsValue} acessos, cada recurso acessado abre novas formas de entender o conteúdo!`,
          `Explorar materiais diversifica seu aprendizado. Com ${materialsValue} acessos, vídeos, textos e exercícios complementam o que você vê em sala!`,
          `Acesso a materiais é como ter uma biblioteca pessoal. Com ${materialsValue} acessos, quanto mais você explora, mais rico fica seu conhecimento!`,
        ];
        message += materialsMessages[Math.floor(Math.random() * materialsMessages.length)];
      } else if (topFeature.feature === 'Avisos Visualizados' || topFeature.feature === 'AnnouncementsView' || topFeature.feature === 'announcementsview') {
        const announcementsValue = typeof topFeature.value === 'number' ? topFeature.value : 0;
        const announcementsMessages = [
          `Com apenas ${announcementsValue} avisos visualizados, você pode estar perdendo informações importantes. Tente acompanhar mais os comunicados da escola!`,
          `Visualizar avisos te mantém informado sobre eventos e prazos. Com ${announcementsValue} visualizações, aumente para pelo menos 15-20 para não perder nada!`,
          `Os avisos contêm informações valiosas! Com ${announcementsValue} visualizações, acompanhar regularmente te ajuda a se organizar melhor!`,
          `Estar por dentro dos avisos é essencial! Com ${announcementsValue} visualizações, tente verificar os comunicados pelo menos uma vez por semana!`,
        ];
        message += announcementsMessages[Math.floor(Math.random() * announcementsMessages.length)];
      } else if (topFeature.feature === 'Participações em Discussões' || topFeature.feature === 'Discussion' || topFeature.feature === 'discussion') {
        const discussionValue = typeof topFeature.value === 'number' ? topFeature.value : 0;
        const discussionMessages = [
          `Com apenas ${discussionValue} participações em discussões, você está perdendo oportunidades de aprendizado colaborativo. Participe mais de fóruns e debates!`,
          `Participar de discussões enriquece seu aprendizado. Com ${discussionValue} participações, tente aumentar para pelo menos 15-20 para trocar ideias com colegas!`,
          `As discussões são espaços de aprendizado coletivo! Com ${discussionValue} participações, cada debate te ajuda a entender melhor o conteúdo!`,
          `Participe mais de discussões! Com ${discussionValue} participações, você pode compartilhar ideias e aprender com seus colegas!`,
        ];
        message += discussionMessages[Math.floor(Math.random() * discussionMessages.length)];
      } else {
        const genericRiskMessages = [
          `Melhorar seu ${topFeature.feature.toLowerCase()} pode ajudar muito a reduzir o risco. Você consegue! 💪`,
          `Trabalhar no seu ${topFeature.feature.toLowerCase()} fará uma grande diferença. Vamos juntos nessa jornada! 🌱`,
          `Focar em melhorar seu ${topFeature.feature.toLowerCase()} é um passo importante. Acredite no seu potencial! ✨`,
          `Investir no seu ${topFeature.feature.toLowerCase()} é essencial para reduzir o risco. Cada esforço conta! 🎯`,
          `Desenvolver seu ${topFeature.feature.toLowerCase()} te ajudará a se sentir mais engajado. Comece hoje mesmo! 🌟`,
          `O ${topFeature.feature.toLowerCase()} precisa de atenção, mas você tem capacidade de melhorar! Vamos nessa! 💎`,
          `Trabalhar no ${topFeature.feature.toLowerCase()} é uma oportunidade de crescimento. Você tem potencial! 🚀`,
        ];
        message += genericRiskMessages[Math.floor(Math.random() * genericRiskMessages.length)];
      }
    } else {
      // Se for "Faltas Escolares" com influência positiva, usar "presença" ao invés de "faltas escolares"
      if (topFeature.feature === 'Faltas Escolares') {
        const presencePositiveMessages = [
          `Ótima notícia! Sua presença está reduzindo seu risco de evasão! 🎉`,
          `Parabéns! Sua presença está te ajudando a permanecer engajado! 👏`,
          `Excelente! Sua presença está sendo um grande aliado na sua permanência! ⭐`,
          `Incrível! Sua presença está sendo um diferencial positivo! Continue assim! 🌟`,
          `Fantástico! Sua presença está te mantendo conectado com os estudos! 🚀`,
          `Muito bem! Sua presença está sendo um ponto forte na sua jornada! 💎`,
          `Que bom! Sua presença está te ajudando a se manter engajado! 💪`,
        ];
        message = presencePositiveMessages[Math.floor(Math.random() * presencePositiveMessages.length)];
        const presenceMessages = [
          ' Sua presença regular está fazendo toda a diferença! Continue assim!',
          ' Sua presença nas aulas está te mantendo engajado! Parabéns!',
          ' Sua presença constante é um ponto forte! Continue comparecendo regularmente!',
          ' Sua presença faz toda diferença! Continue mantendo essa frequência!',
        ];
        message += presenceMessages[Math.floor(Math.random() * presenceMessages.length)];
      } else {
        // Para outras features com influência positiva, usar as mensagens padrão
        message = positiveRiskMessages[Math.floor(Math.random() * positiveRiskMessages.length)];
        
        if (topFeature.feature === 'Participação em Aula') {
          message += ' Continue participando ativamente - isso está te mantendo engajado!';
        } else if (topFeature.feature === 'Materiais Acessados') {
          message += ' Continue explorando os materiais disponíveis!';
        } else {
          message += ' Continue mantendo esse bom hábito!';
        }
      }
    }
    
    if (features.length > 1) {
      message += ` Outros fatores: ${features.slice(1, 3).map(f => f.feature.toLowerCase()).join(', ')}.`;
    }
  } else {
    // Fallback se não conseguir parsear
    // Normalizar classificação para evitar problemas de formatação
    let classificacaoNormalizada = 'calculado';
    if (classificacao) {
      try {
        // Normalizar variações de "médio" e outras classificações
        const classificacaoLower = classificacao.toLowerCase().trim();
        if (classificacaoLower === 'medio' || classificacaoLower === 'médio') {
          classificacaoNormalizada = 'médio';
        } else if (classificacaoLower === 'baixo') {
          classificacaoNormalizada = 'baixo';
        } else if (classificacaoLower === 'alto') {
          classificacaoNormalizada = 'alto';
        } else {
          // Manter original se não for uma das classificações conhecidas
          classificacaoNormalizada = classificacao;
        }
      } catch (error) {
        classificacaoNormalizada = 'calculado';
      }
    }
    message = `Seu risco de evasão é ${classificacaoNormalizada}. `;
    // Limitar explicação para evitar problemas
    try {
      const explicacaoLimitada = explanation ? explanation.substring(0, 200) : '';
      message += explicacaoLimitada;
    } catch (error) {
      message += 'Analise seus dados de engajamento para mais detalhes.';
    }
  }
  
  const suggestions = generateSuggestions(features, 'dropout');
  
  return {
    title,
    message,
    features: features.slice(0, 3), // Top 3 features
    suggestions,
  };
}

