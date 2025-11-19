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
 * Corrige a influência baseada no valor da feature (para valores categóricos)
 */
function correctInfluenceByValue(featureName: string, value: string | number, originalInfluence: 'positiva' | 'negativa'): 'positiva' | 'negativa' {
  // Se for numérico, mantém a influência original
  if (typeof value === 'number') {
    return originalInfluence;
  }
  
  const valueStr = String(value).toLowerCase().trim();
  
  // Valores que são sempre positivos
  const positiveValues = ['good', 'high', 'yes', 'positive', 'near', "bachelor's", "master's", 'some college'];
  // Valores que são sempre negativos
  const negativeValues = ['poor', 'low', 'no', 'negative', 'far', 'none', 'bad', 'above-7'];
  
  if (positiveValues.some(pv => valueStr.includes(pv))) {
    return 'positiva';
  }
  
  if (negativeValues.some(nv => valueStr.includes(nv))) {
    return 'negativa';
  }
  
  // Para features específicas, verifica o contexto
  const friendlyName = getFriendlyFeatureName(featureName);
  
  // Acesso a Recursos: Good/Average = positivo, Poor = negativo
  if (friendlyName === 'Acesso a Recursos' || friendlyName === 'Qualidade do Professor') {
    if (valueStr.includes('good') || valueStr.includes('average')) {
      return 'positiva';
    }
    if (valueStr.includes('poor')) {
      return 'negativa';
    }
  }
  
  // Nível Educacional: Bachelor's/Master's = positivo, None/High School = pode ser negativo
  if (friendlyName === 'Nível Educacional dos Pais') {
    if (valueStr.includes("bachelor's") || valueStr.includes("master's") || valueStr.includes('some college')) {
      return 'positiva';
    }
    if (valueStr.includes('none')) {
      return 'negativa';
    }
  }
  
  // Envolvimento, Motivação, Renda, Atividade Física: High = positivo, Low = negativo
  if (friendlyName === 'Envolvimento dos Pais' || 
      friendlyName === 'Nível de Motivação' || 
      friendlyName === 'Renda Familiar' ||
      friendlyName === 'Atividade Física') {
    if (valueStr.includes('high')) {
      return 'positiva';
    }
    if (valueStr.includes('low')) {
      return 'negativa';
    }
  }
  
  // Influência dos Colegas: Positive = positivo, Negative = negativo
  if (friendlyName === 'Influência dos Colegas') {
    if (valueStr.includes('positive')) {
      return 'positiva';
    }
    if (valueStr.includes('negative')) {
      return 'negativa';
    }
  }
  
  // Faltas: Under-7 = positivo, Above-7 = negativo
  if (friendlyName === 'Faltas Escolares') {
    if (valueStr.includes('under-7') || valueStr.includes('under 7')) {
      return 'positiva';
    }
    if (valueStr.includes('above-7') || valueStr.includes('above 7')) {
      return 'negativa';
    }
  }
  
  // Distância: Near = positivo, Far = negativo
  if (friendlyName === 'Distância de Casa') {
    if (valueStr.includes('near')) {
      return 'positiva';
    }
    if (valueStr.includes('far')) {
      return 'negativa';
    }
  }
  
  // Se não conseguir determinar, mantém a influência original
  return originalInfluence;
}

/**
 * Extrai features da explicação de performance
 */
function parsePerformanceExplanation(explanation: string): ParsedFeature[] {
  const features: ParsedFeature[] = [];
  
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
    
    features.push({
      feature: getFriendlyFeatureName(featureName),
      value: finalValue,
      influence: correctedInfluence,
      impact: 'high', // Features mencionadas são sempre de alto impacto
    });
  }
  
  return features;
}

/**
 * Extrai features da explicação de evasão
 */
function parseDropoutExplanation(explanation: string): ParsedFeature[] {
  const features: ParsedFeature[] = [];
  
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
    
    features.push({
      feature: getFriendlyFeatureName(featureName),
      value: finalValue,
      influence: correctedInfluence,
      impact: 'high',
    });
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
        features.push({
          feature: keyword.feature,
          value: 'detectado',
          influence: keyword.influence,
          impact: 'high',
        });
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
        default:
          suggestions.push(`Melhore seu ${feature.feature.toLowerCase()} para obter melhores resultados`);
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
    
    const averageMessages = [
      'Sua nota prevista está na média. 💡 Com mais dedicação e organização, você tem potencial para melhorar significativamente!',
      'Sua nota prevista mostra que há espaço para crescimento! 🌟 Não desista - com foco e disciplina, você pode alcançar melhores resultados!',
      'Sua nota prevista está boa, mas pode melhorar! ✨ Identifique seus pontos fracos e trabalhe neles com dedicação!',
    ];
    
    const belowAverageMessages = [
      'Sua nota prevista está abaixo do esperado, mas não desanime! 💪 Com foco, dedicação e organização, você pode melhorar muito!',
      'Sua nota prevista indica que há desafios, mas você tem potencial! 🌱 Não desista - cada pequeno passo conta!',
      'Sua nota prevista está baixa, mas isso não define você! 🎯 Com determinação e apoio, você pode superar qualquer desafio!',
    ];
    
    if (nota >= 90) {
      message = excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
    } else if (nota >= 80) {
      message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    } else if (nota >= 70) {
      message = averageMessages[Math.floor(Math.random() * averageMessages.length)];
    } else if (nota >= 60) {
      message = averageMessages[Math.floor(Math.random() * averageMessages.length)];
    } else {
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
    
    return {
      title,
      message,
      features: [],
      suggestions: genericSuggestions[Math.floor(Math.random() * genericSuggestions.length)],
    };
  }
  
  // Parse da explicação
  const features = parsePerformanceExplanation(explanation);
  
  // Gera título e mensagem principal
  const titles = [
    'O que mais influenciou sua nota',
    'Principais fatores da sua predição',
    'Análise do seu desempenho',
  ];
  let title = titles[Math.floor(Math.random() * titles.length)];
  let message = '';
  
  if (features.length > 0) {
    const topFeature = features[0];
    const featureValue = topFeature.value;
    const isNumeric = typeof featureValue === 'number';
    
    // Array de mensagens variadas para tornar o feedback mais amigável
    const positiveMessages = [
      `Parabéns! Seu ${topFeature.feature.toLowerCase()} está contribuindo muito para seu sucesso! 🎉`,
      `Ótimo trabalho! Seu ${topFeature.feature.toLowerCase()} está fazendo toda a diferença! 👏`,
      `Excelente! Seu ${topFeature.feature.toLowerCase()} está te ajudando a alcançar bons resultados! ⭐`,
      `Que bom! Seu ${topFeature.feature.toLowerCase()} está sendo um grande aliado no seu aprendizado! 💪`,
    ];
    
    const negativeMessages = [
      `Sua nota foi impactada principalmente por ${topFeature.feature.toLowerCase()}. `,
      `O principal fator que está afetando sua nota é ${topFeature.feature.toLowerCase()}. `,
      `Identificamos que ${topFeature.feature.toLowerCase()} está sendo o maior desafio para seu desempenho. `,
    ];
    
    if (topFeature.influence === 'negativa') {
      // Escolhe uma mensagem negativa aleatória
      const randomNegativeMsg = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
      message = randomNegativeMsg;
      
      if (topFeature.feature === 'Horas de Estudo') {
        // O valor vem em horas semanais do ML
        const weeklyHours = isNumeric ? featureValue : 0;
        const dailyHours = weeklyHours / 7;
        
        const studyMessages = {
          veryLow: [
            `Com apenas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está estudando menos do que o ideal. Que tal aumentar para pelo menos 28-35 horas semanais?`,
            `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) é muito pouco para alcançar seus objetivos. Tente dedicar mais tempo aos estudos!`,
            `Seu tempo de estudo atual (${weeklyHours}h semanais, ${dailyHours.toFixed(1)}h por dia) pode estar limitando seu potencial. Aumentar para 28-35 horas semanais faria uma grande diferença!`,
          ],
          low: [
            `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) são um bom começo, mas ainda podem ser insuficientes. Tente aumentar para pelo menos 28-35 horas semanais para ver melhorias significativas!`,
            `Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está no caminho certo, mas pode melhorar! Aumentar para 28-35 horas semanais te ajudaria muito.`,
          ],
          high: [
            `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) é bastante tempo! Mas lembre-se: qualidade é mais importante que quantidade. Considere equilibrar melhor com descanso.`,
            `Você está dedicando ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) aos estudos - isso é muito! Não esqueça de descansar, pois o cansaço pode prejudicar seu aprendizado.`,
          ],
          medium: [
            `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) podem não estar sendo aproveitadas da melhor forma. Foque na qualidade do estudo e em técnicas eficientes!`,
            `Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você tem potencial para melhorar! Tente técnicas de estudo mais ativas e eficientes.`,
          ],
        };
        
        if (isNumeric && weeklyHours >= 50) {
          message += studyMessages.high[Math.floor(Math.random() * studyMessages.high.length)];
        } else if (isNumeric && weeklyHours < 20) {
          message += studyMessages.veryLow[Math.floor(Math.random() * studyMessages.veryLow.length)];
        } else if (isNumeric && weeklyHours < 28) {
          message += studyMessages.low[Math.floor(Math.random() * studyMessages.low.length)];
        } else {
          message += studyMessages.medium[Math.floor(Math.random() * studyMessages.medium.length)];
        }
      } else if (topFeature.feature === 'Frequência às Aulas') {
        const attendanceMessages = {
          veryLow: [
            `Sua frequência de ${featureValue}% está muito abaixo do ideal. Comparecer às aulas é fundamental para não perder conteúdo importante. Tente aumentar para pelo menos 80%!`,
            `Com ${featureValue}% de frequência, você está perdendo muito conteúdo. Cada aula perdida é uma oportunidade de aprendizado que não volta. Vamos melhorar isso?`,
          ],
          low: [
            `Sua frequência de ${featureValue}% pode estar afetando seu aprendizado. Tente aumentar para pelo menos 80% para não perder conteúdo essencial.`,
            `Com ${featureValue}% de frequência, há espaço para melhorar. Comparecer mais às aulas te ajudará a entender melhor o conteúdo!`,
          ],
        };
        
        if (isNumeric && featureValue < 70) {
          message += attendanceMessages.veryLow[Math.floor(Math.random() * attendanceMessages.veryLow.length)];
        } else {
          message += attendanceMessages.low[Math.floor(Math.random() * attendanceMessages.low.length)];
        }
      } else if (topFeature.feature === 'Horas de Sono') {
        const sleepMessages = {
          veryLow: [
            `Dormir apenas ${featureValue} horas por noite não é suficiente! O sono é essencial para fixar o aprendizado. Tente dormir pelo menos 7-8 horas para melhorar sua concentração.`,
            `Com ${featureValue} horas de sono por noite, seu cérebro não tem tempo suficiente para descansar. Um bom sono (7-8h) faz toda a diferença no aprendizado!`,
          ],
          veryHigh: [
            `Dormir ${featureValue} horas por noite pode estar reduzindo seu tempo disponível para estudos. Tente equilibrar: 7-8 horas de sono são ideais!`,
            `${featureValue} horas de sono por noite é bastante! Considere reduzir um pouco para ter mais tempo de estudo, mantendo 7-8 horas que são suficientes.`,
          ],
          medium: [
            `Suas ${featureValue} horas de sono podem estar impactando seu desempenho. Uma rotina de sono regular e de qualidade (7-8h) é fundamental!`,
            `Com ${featureValue} horas de sono, tente estabelecer uma rotina mais consistente. O sono de qualidade melhora muito a concentração!`,
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
        ];
        message += motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      } else if (topFeature.feature === 'Notas Anteriores') {
        const previousScoresMessages = [
          `Suas notas anteriores (${featureValue}) indicam que há espaço para crescimento. Não desanime - cada novo semestre é uma nova oportunidade!`,
          `Com notas anteriores de ${featureValue}, você tem potencial para melhorar muito. Foque nos pontos que mais impactam seu desempenho!`,
        ];
        message += previousScoresMessages[Math.floor(Math.random() * previousScoresMessages.length)];
      } else {
        // Mensagem genérica mas contextual e variada
        const valueStr = isNumeric ? featureValue.toString() : featureValue;
        const genericMessages = [
          `Seu ${topFeature.feature.toLowerCase()} (${valueStr}) está impactando negativamente seu desempenho. Focar em melhorar isso pode fazer uma grande diferença!`,
          `O ${topFeature.feature.toLowerCase()} (${valueStr}) está sendo um desafio. Mas não se preocupe - com dedicação, você pode melhorar!`,
          `Identificamos que seu ${topFeature.feature.toLowerCase()} (${valueStr}) precisa de atenção. Trabalhar nisso te ajudará a alcançar melhores resultados!`,
        ];
        message += genericMessages[Math.floor(Math.random() * genericMessages.length)];
      }
    } else {
      // Influência positiva - mensagens mais encorajadoras
      const randomPositiveMsg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
      message = randomPositiveMsg;
      
      if (topFeature.feature === 'Horas de Estudo' && isNumeric) {
        const weeklyHours = featureValue;
        const dailyHours = weeklyHours / 7;
        const studyPositiveMessages = [
          `Estudar ${weeklyHours} horas por semana (${dailyHours.toFixed(1)}h por dia) está te levando ao sucesso! Continue mantendo essa dedicação! 💪`,
          `Suas ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia) de estudo estão rendendo frutos! Parabéns pela disciplina! 🌟`,
          `Excelente! Com ${weeklyHours} horas semanais (${dailyHours.toFixed(1)}h por dia), você está no caminho certo! Continue assim! 🎯`,
        ];
        message = studyPositiveMessages[Math.floor(Math.random() * studyPositiveMessages.length)];
      } else if (topFeature.feature === 'Frequência às Aulas' && isNumeric) {
        const attendancePositiveMessages = [
          `Sua frequência de ${featureValue}% está excelente! Comparecer às aulas regularmente é um dos segredos do sucesso! 👏`,
          `Ótimo! Com ${featureValue}% de frequência, você está aproveitando ao máximo as aulas. Continue assim! ⭐`,
          `Parabéns! Sua frequência de ${featureValue}% mostra seu comprometimento. Isso está fazendo toda a diferença! 🎉`,
        ];
        message = attendancePositiveMessages[Math.floor(Math.random() * attendancePositiveMessages.length)];
      } else if (topFeature.feature === 'Acesso a Recursos' || topFeature.feature === 'Qualidade do Professor') {
        const resourceMessages = [
          `Ter ${topFeature.feature.toLowerCase()} de qualidade está te ajudando muito! Continue aproveitando bem esses recursos! 📚`,
          `Ótimo! Seu ${topFeature.feature.toLowerCase()} está contribuindo positivamente para seu aprendizado! 💡`,
        ];
        message = resourceMessages[Math.floor(Math.random() * resourceMessages.length)];
      } else if (topFeature.feature === 'Envolvimento dos Pais' || topFeature.feature === 'Nível de Motivação') {
        const supportMessages = [
          `Ter ${topFeature.feature.toLowerCase()} está sendo um grande apoio no seu aprendizado! Continue valorizando isso! 🤝`,
          `Excelente! Seu ${topFeature.feature.toLowerCase()} está te dando a base necessária para o sucesso! 🌱`,
        ];
        message = supportMessages[Math.floor(Math.random() * supportMessages.length)];
      } else {
        const genericPositiveMessages = [
          `Continue mantendo esse bom hábito! Ele está fazendo toda a diferença! ✨`,
          `Parabéns! Seu ${topFeature.feature.toLowerCase()} está te ajudando a alcançar seus objetivos! 🎊`,
          `Ótimo trabalho! Continue investindo nesse aspecto - está valendo a pena! 💎`,
        ];
        message = genericPositiveMessages[Math.floor(Math.random() * genericPositiveMessages.length)];
      }
    }
    
    if (features.length > 1) {
      message += ` Outros fatores importantes: ${features.slice(1, 3).map(f => f.feature.toLowerCase()).join(', ')}.`;
    }
  } else {
    // Fallback se não conseguir parsear
    message = `Sua nota prevista é ${notaPrevista?.toFixed(1) || 'calculada'}. `;
    message += explanation.substring(0, 200); // Primeiros 200 caracteres da explicação
  }
  
  const suggestions = generateSuggestions(features, 'performance');
  
  return {
    title,
    message,
    features: features.slice(0, 3), // Top 3 features
    suggestions,
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
  let title = 'O que mais influencia seu risco de evasão';
  let message = '';
  
  if (features.length > 0) {
    const topFeature = features[0];
    
    const negativeRiskMessages = [
      `Seu risco de evasão é aumentado principalmente por ${topFeature.feature.toLowerCase()}. `,
      `O principal fator que está elevando seu risco de evasão é ${topFeature.feature.toLowerCase()}. `,
      `Identificamos que ${topFeature.feature.toLowerCase()} está sendo o maior desafio para sua permanência. `,
    ];
    
    const positiveRiskMessages = [
      `Ótima notícia! Seu ${topFeature.feature.toLowerCase()} está reduzindo seu risco de evasão! 🎉`,
      `Parabéns! Seu ${topFeature.feature.toLowerCase()} está te ajudando a permanecer engajado! 👏`,
      `Excelente! Seu ${topFeature.feature.toLowerCase()} está sendo um grande aliado na sua permanência! ⭐`,
    ];
    
    if (topFeature.influence === 'negativa') {
      message = negativeRiskMessages[Math.floor(Math.random() * negativeRiskMessages.length)];
      
      if (topFeature.feature === 'Faltas Escolares') {
        const absenceMessages = [
          'Muitas faltas podem indicar desengajamento. Tente reduzir suas ausências - cada aula é importante!',
          'As faltas estão aumentando seu risco. Comparecer mais às aulas te ajudará a se sentir mais conectado com os estudos.',
          'Reduzir suas faltas é fundamental. Quando você falta, perde conteúdo e conexão com a turma. Vamos melhorar isso?',
        ];
        message += absenceMessages[Math.floor(Math.random() * absenceMessages.length)];
      } else if (topFeature.feature === 'Participação em Aula') {
        const participationMessages = [
          'Pouca participação pode indicar falta de interesse. Que tal se envolver mais? Fazer perguntas e responder ajuda muito!',
          'Participar mais das aulas te ajudará a se sentir mais engajado. Não tenha medo de levantar a mão e interagir!',
          'A participação ativa nas aulas faz toda a diferença. Tente fazer pelo menos uma pergunta ou comentário por aula!',
        ];
        message += participationMessages[Math.floor(Math.random() * participationMessages.length)];
      } else if (topFeature.feature === 'Materiais Acessados') {
        const materialsMessages = [
          'Acessar poucos materiais pode afetar seu aprendizado. Explore mais os recursos disponíveis - há muito conteúdo interessante!',
          'Os materiais de estudo estão aí para te ajudar! Acesse mais vídeos, textos e exercícios para melhorar seu aprendizado.',
          'Que tal explorar mais os materiais disponíveis? Quanto mais você acessa, mais opções de aprendizado você tem!',
        ];
        message += materialsMessages[Math.floor(Math.random() * materialsMessages.length)];
      } else {
        const genericRiskMessages = [
          `Melhorar seu ${topFeature.feature.toLowerCase()} pode ajudar muito a reduzir o risco. Você consegue! 💪`,
          `Trabalhar no seu ${topFeature.feature.toLowerCase()} fará uma grande diferença. Vamos juntos nessa jornada! 🌱`,
          `Focar em melhorar seu ${topFeature.feature.toLowerCase()} é um passo importante. Acredite no seu potencial! ✨`,
        ];
        message += genericRiskMessages[Math.floor(Math.random() * genericRiskMessages.length)];
      }
    } else {
      message = positiveRiskMessages[Math.floor(Math.random() * positiveRiskMessages.length)];
      
      if (topFeature.feature === 'Faltas Escolares') {
        message += ' Continue comparecendo às aulas regularmente!';
      } else if (topFeature.feature === 'Participação em Aula') {
        message += ' Continue participando ativamente - isso está te mantendo engajado!';
      } else if (topFeature.feature === 'Materiais Acessados') {
        message += ' Continue explorando os materiais disponíveis!';
      } else {
        message += ' Continue mantendo esse bom hábito!';
      }
    }
    
    if (features.length > 1) {
      message += ` Outros fatores: ${features.slice(1, 3).map(f => f.feature.toLowerCase()).join(', ')}.`;
    }
  } else {
    // Fallback se não conseguir parsear
    message = `Seu risco de evasão é ${classificacao || 'calculado'}. `;
    message += explanation.substring(0, 200);
  }
  
  const suggestions = generateSuggestions(features, 'dropout');
  
  return {
    title,
    message,
    features: features.slice(0, 3), // Top 3 features
    suggestions,
  };
}

