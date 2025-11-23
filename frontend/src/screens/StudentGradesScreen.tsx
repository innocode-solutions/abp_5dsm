import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';
import { getStudentIdByUserId } from '../service/studentService';

interface Nota {
  IDNota: string;
  Valor: number;
  Tipo: string | null;
  DataAvaliacao: string;
  Observacoes: string | null;
  matricula: {
    IDMatricula: string;
    disciplina: {
      NomeDaDisciplina: string;
    };
    periodo: {
      Nome: string;
    };
  };
}

interface MatriculaComNotas {
  IDMatricula: string;
  disciplina: {
    NomeDaDisciplina: string;
  };
  periodo: {
    Nome: string;
  };
  notas: Nota[];
  Nota: number | null; // Média da matrícula
}

export default function StudentGradesScreen() {
  const { user } = useAuth();
  const [matriculas, setMatriculas] = useState<MatriculaComNotas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      if (!user?.IDUser) return;

      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        setLoading(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiConnection.get(`/notas/aluno/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMatriculas(response.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGrades();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getGradeColor = (valor: number) => {
    if (valor >= 7) return '#2E7D32'; // Verde
    if (valor >= 5) return '#F57C00'; // Laranja
    return '#D32F2F'; // Vermelho
  };

  const getGradeIcon = (valor: number) => {
    if (valor >= 7) return 'check-circle';
    if (valor >= 5) return 'alert-circle';
    return 'x-circle';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || "#4A90E2"} />
          <Text style={styles.loadingText}>Carregando notas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matriculas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Feather name="file-text" size={64} color={colors.muted || "#999"} />
          <Text style={styles.emptyText}>Nenhuma nota encontrada</Text>
          <Text style={styles.emptySubtext}>
            Suas notas aparecerão aqui quando forem lançadas pelos professores
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {matriculas.map((matricula) => {
          const media = matricula.Nota;
          const hasNotes = matricula.notas && matricula.notas.length > 0;

          return (
            <View key={matricula.IDMatricula} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>
                    {matricula.disciplina.NomeDaDisciplina}
                  </Text>
                  <Text style={styles.periodText}>
                    {matricula.periodo.Nome}
                  </Text>
                </View>
                {media !== null && (
                  <View style={[
                    styles.mediaBadge,
                    { backgroundColor: getGradeColor(media) }
                  ]}>
                    <Feather
                      name={getGradeIcon(media)}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.mediaText}>
                      Média: {media.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              {hasNotes ? (
                <View style={styles.notesContainer}>
                  {matricula.notas.map((nota) => (
                    <View key={nota.IDNota} style={styles.noteItem}>
                      <View style={styles.noteLeft}>
                        <Text style={styles.noteType}>
                          {nota.Tipo || 'Sem tipo'}
                        </Text>
                        <Text style={styles.noteDate}>
                          {formatDate(nota.DataAvaliacao)}
                        </Text>
                        {nota.Observacoes && (
                          <Text style={styles.noteObservations}>
                            {nota.Observacoes}
                          </Text>
                        )}
                      </View>
                      <View style={[
                        styles.noteValueContainer,
                        { backgroundColor: getGradeColor(nota.Valor) + '20' }
                      ]}>
                        <Text style={[
                          styles.noteValue,
                          { color: getGradeColor(nota.Valor) }
                        ]}>
                          {nota.Valor.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noNotesContainer}>
                  <Feather name="inbox" size={24} color={colors.muted || "#999"} />
                  <Text style={styles.noNotesText}>
                    Nenhuma nota lançada ainda
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.muted || "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text || "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.muted || "#666",
    marginTop: 8,
    textAlign: 'center',
  },
  subjectCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text || "#333",
    marginBottom: 4,
  },
  periodText: {
    fontSize: 14,
    color: colors.muted || "#666",
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mediaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  noteLeft: {
    flex: 1,
  },
  noteType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || "#333",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: colors.muted || "#666",
    marginBottom: 4,
  },
  noteObservations: {
    fontSize: 12,
    color: colors.muted || "#666",
    fontStyle: 'italic',
  },
  noteValueContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  noteValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  noNotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noNotesText: {
    fontSize: 14,
    color: colors.muted || "#666",
  },
});

