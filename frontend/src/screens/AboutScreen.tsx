import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Feather name="info" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Sobre o Sistema</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistema de Gestão Acadêmica</Text>
          <Text style={styles.description}>
            Plataforma desenvolvida para auxiliar na gestão acadêmica, com funcionalidades de
            acompanhamento de desempenho estudantil, predições de desempenho e risco de evasão,
            e gestão de notas e matrículas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Predição de Desempenho</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Análise de Risco de Evasão</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Gestão de Notas e Avaliações</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Feedbacks Personalizados</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Relatórios e Dashboards</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Versão</Text>
          <Text style={styles.version}>1.0.0</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Sistema de Gestão Acadêmica
          </Text>
          <Text style={styles.footerSubtext}>
            Desenvolvido para facilitar a gestão educacional
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
  },
  version: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.muted,
  },
});

