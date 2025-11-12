import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import { Student } from '../service/studentService';

interface StudentListItemProps {
  student: Student;
}

function StudentListItem({ student }: StudentListItemProps) {
  const getRiskColor = (risk: 'baixo' | 'médio' | 'alto' | null) => {
    if (!risk) return colors.muted;
    switch (risk) {
      case 'baixo':
        return '#22c55e'; // verde
      case 'médio':
        return '#eab308'; // amarelo
      case 'alto':
        return '#ef4444'; // vermelho
      default:
        return colors.muted;
    }
  };

  const getRiskLabel = (risk: 'baixo' | 'médio' | 'alto' | null) => {
    if (!risk) return 'Sem risco';
    return `Risco ${risk}`;
  };

  const formatScore = (score: number | null) => {
    if (score === null) return 'N/A';
    return score.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.email}>{student.email}</Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Nota Prevista</Text>
          <Text style={styles.scoreValue}>
            {formatScore(student.performance_score)}
          </Text>
        </View>
        <View style={styles.riskContainer}>
          <View
            style={[
              styles.riskBadge,
              { backgroundColor: getRiskColor(student.dropout_risk) },
            ]}
          >
            <Text style={styles.riskText}>
              {getRiskLabel(student.dropout_risk)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: colors.muted,
  },
  metrics: {
    alignItems: 'flex-end',
    gap: 8,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  riskContainer: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
});

export default React.memo(StudentListItem);

