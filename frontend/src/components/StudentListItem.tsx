import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { Student } from '../service/studentService';

interface StudentListItemProps {
  student: Student;
  onAddNota?: (studentId: string, studentName: string) => void;
}

function StudentListItem({ student, onAddNota }: StudentListItemProps) {
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
        {onAddNota && (
          <TouchableOpacity
            style={styles.addNotaButton}
            onPress={() => onAddNota(student.id, student.name)}
          >
            <Feather name="plus-circle" size={20} color={colors.primary} />
            <Text style={styles.addNotaText}>Adicionar Nota</Text>
          </TouchableOpacity>
        )}
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
  addNotaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 6,
  },
  addNotaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default React.memo(StudentListItem);

