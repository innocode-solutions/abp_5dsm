import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { Class } from '../service/classService';

interface ClassListItemProps {
  classItem: Class;
  onPress?: () => void;
}

function ClassListItem({ classItem, onPress }: ClassListItemProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Feather name="book-open" size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.className} numberOfLines={2}>
          {classItem.NomeDaDisciplina}
        </Text>
        <Text style={styles.studentCount}>
          {classItem.studentCount} {classItem.studentCount === 1 ? 'aluno' : 'alunos'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  studentCount: {
    fontSize: 14,
    color: colors.muted,
  },
});

export default React.memo(ClassListItem);

