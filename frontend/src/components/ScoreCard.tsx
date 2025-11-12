import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import colors from '../theme/colors';

type ScoreCardProps = {
  score: number; // 0-100
  category?: string;
  showLabel?: boolean;
};

const { width } = Dimensions.get('window');

export default function ScoreCard({ score, category, showLabel = true }: ScoreCardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(0);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return colors.excellent;
    if (score >= 80) return colors.good;
    if (score >= 70) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getCategoryLabel = (score: number): string => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muito Bom';
    if (score >= 70) return 'Bom';
    if (score >= 60) return 'Regular';
    return 'Insuficiente';
  };

  const scoreColor = getScoreColor(score);
  const categoryLabel = category || getCategoryLabel(score);
  const isApproved = score >= 60;

  // Calcular tamanho do círculo baseado na largura da tela (responsivo)
  const maxCircleSize = Math.min(width * 0.5, 200);
  const circleSize = Math.max(maxCircleSize, 150);
  const strokeWidth = 14;

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Resetar animação quando o score mudar
    animatedValue.setValue(0);
    setDisplayScore(0);
    
    // Animação simples
    const animation = Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    });

    // Usar um intervalo simples para atualizar o displayScore
    let intervalId: ReturnType<typeof setInterval>;
    let currentValue = 0;
    const step = score / 50; // 50 atualizações durante a animação
    const updateInterval = 1200 / 50; // 24ms por atualização

    intervalId = setInterval(() => {
      currentValue += step;
      if (currentValue >= score) {
        currentValue = score;
        clearInterval(intervalId);
      }
      setDisplayScore(Math.round(currentValue * 10) / 10);
    }, updateInterval);

    animation.start();

    return () => {
      clearInterval(intervalId);
      animation.stop();
    };
  }, [score]);

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>Nota Prevista</Text>
      )}
      
      <View style={styles.circleContainer}>
        <View 
          style={[
            styles.circle,
            { 
              width: circleSize, 
              height: circleSize,
              borderRadius: circleSize / 2,
              borderWidth: strokeWidth,
              borderColor: scoreColor + '20', // Cor com transparência para o fundo
              backgroundColor: '#fff',
            }
          ]}
        >
          <View style={styles.scoreContent}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {displayScore.toFixed(1)}
            </Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
        </View>
        
        {/* Barra de progresso animada */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                width: progressWidth,
                backgroundColor: scoreColor,
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <Text style={[styles.categoryText, { color: scoreColor }]}>
          {categoryLabel}
        </Text>
        <Text style={[styles.statusText, { color: isApproved ? colors.success : colors.error }]}>
          {isApproved ? '✅ Aprovado' : '❌ Reprovado'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderStyle: 'solid',
  },
  scoreContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 4,
  },
  progressBarContainer: {
    width: '70%',
    maxWidth: width * 0.7,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});

