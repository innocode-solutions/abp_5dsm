import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Section from '../components/Section';
import StudentItem from '../components/StudentItem';
import colors from '../theme/colors';

type Student = {
  id: string;
  name: string;
  course: string;
  avatar: string;
};

const MOCK = {
  overview: {
    ativos: 120,
    inativos: 30,
    total: 150,
  },
  evasao: {
    taxa: '10 %',
  },
  risco: [
    { id: '1', name: 'Lucas Oliveira',  course: 'Engenharia de Software',   avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: '2', name: 'Isabela Santos',  course: 'Ciência da Computação',    avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    // adicione quantos quiser; o FlatList dá conta do scroll
    { id: '3', name: 'Marcos Lima',     course: 'Sistemas de Informação',   avatar: 'https://randomuser.me/api/portraits/men/11.jpg' },
    { id: '4', name: 'Ana Souza',       course: 'Engenharia de Produção',   avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { id: '5', name: 'Pedro Carvalho',  course: 'Engenharia Elétrica',      avatar: 'https://randomuser.me/api/portraits/men/78.jpg' },
    { id: '6', name: 'Beatriz Ramos',   course: 'Ciência de Dados',         avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
  ] as Student[],
};

export default function DashboardScreen() {
  const students = MOCK.risco;

  const ListHeader = useMemo(
    () => (
      <View style={{ gap: 20 }}>
        <Section title="Visao Geral dos Alunos">
          <View style={styles.grid}>
            <Card>
              <Text style={styles.cardLabel}>Ativos</Text>
              <Text style={styles.cardValue}>{MOCK.overview.ativos}</Text>
            </Card>
            <Card>
              <Text style={styles.cardLabel}>Inativos</Text>
              <Text style={styles.cardValue}>{MOCK.overview.inativos}</Text>
            </Card>
          </View>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardLabel}>Total</Text>
            <Text style={styles.totalValue}>{MOCK.overview.total}</Text>
          </Card>
        </Section>

        <Section title="Indicadores de Evasão">
          <Card>
            <Text style={styles.cardLabel}>Taxa de Evasao</Text>
            <Text style={styles.cardValue}>{MOCK.evasao.taxa}</Text>
          </Card>
        </Section>

        <Section title="Alunos em Risco" />
        {/* A “card box” será formada pelos próprios itens com cantos arredondados no primeiro/último */}
      </View>
    ),
    []
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<Student>) => {
    const isFirst = index === 0;
    const isLast = index === students.length - 1;

    return (
      <View
        style={[
          styles.rowContainer,
          isFirst && styles.rowFirst,
          isLast && styles.rowLast,
        ]}
      >
        <StudentItem name={item.name} course={item.course} avatar={item.avatar} />
        {!isLast && <View style={styles.innerSeparator} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.container}
        // melhora o desempenho para listas grandes
        initialNumToRender={8}
        windowSize={10}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  cardValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },

  // “Card” que envolve a lista por meio dos próprios itens
  rowContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    // sombras leves
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 4,
  },
  innerSeparator: {
    height: 10,
    backgroundColor: 'transparent',
  },
});
