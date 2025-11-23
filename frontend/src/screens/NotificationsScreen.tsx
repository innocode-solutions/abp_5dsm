import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';

interface Notificacao {
  IDNotificacao: string;
  Tipo: 'DESEMPENHO' | 'EVASAO' | 'NOTA' | 'SISTEMA' | 'ALERTA';
  Titulo: string;
  Mensagem: string;
  Status: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA';
  Link?: string;
  createdAt: string;
  lidaEm?: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      if (!user?.IDUser) return;

      const token = await getToken();
      if (!token) return;

      const response = await apiConnection.get('/notificacoes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotificacoes(response.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      if (!user?.IDUser) return;

      const token = await getToken();
      if (!token) return;

      const response = await apiConnection.get('/notificacoes/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Erro ao carregar contador:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    loadUnreadCount();
  };

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await apiConnection.put(
        `/notificacoes/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Atualizar estado local
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.IDNotificacao === id
            ? { ...notif, Status: 'LIDA' as const, lidaEm: new Date().toISOString() }
            : notif
        )
      );
      loadUnreadCount();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await apiConnection.put(
        '/notificacoes/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotificacoes((prev) =>
        prev.map((notif) => ({
          ...notif,
          Status: 'LIDA' as const,
          lidaEm: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await apiConnection.delete(`/notificacoes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotificacoes((prev) => prev.filter((notif) => notif.IDNotificacao !== id));
      loadUnreadCount();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const deleteAllRead = async () => {
    Alert.alert(
      'Confirmar',
      'Deseja deletar todas as notificações lidas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              await apiConnection.delete('/notificacoes/read/all', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              setNotificacoes((prev) => prev.filter((notif) => notif.Status !== 'LIDA'));
            } catch (error) {
              console.error('Erro ao deletar notificações lidas:', error);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'DESEMPENHO':
        return 'trending-up';
      case 'EVASAO':
        return 'alert-triangle';
      case 'NOTA':
        return 'file-text';
      case 'ALERTA':
        return 'bell';
      default:
        return 'info';
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'DESEMPENHO':
        return '#4A90E2';
      case 'EVASAO':
        return '#F57C00';
      case 'NOTA':
        return '#2E7D32';
      case 'ALERTA':
        return '#D32F2F';
      default:
        return colors.primary || '#4A90E2';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || "#4A90E2"} />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unreadNotifications = notificacoes.filter((n) => n.Status === 'NAO_LIDA');
  const readNotifications = notificacoes.filter((n) => n.Status === 'LIDA');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        {readNotifications.length > 0 && (
          <TouchableOpacity onPress={deleteAllRead} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpar lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notificacoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={64} color={colors.muted || "#999"} />
            <Text style={styles.emptyText}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtext}>
              Você será notificado sobre eventos importantes
            </Text>
          </View>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Novas</Text>
                {unreadNotifications.map((notif) => (
                  <NotificationCard
                    key={notif.IDNotificacao}
                    notificacao={notif}
                    onPress={() => markAsRead(notif.IDNotificacao)}
                    onDelete={() => deleteNotification(notif.IDNotificacao)}
                    getIcon={getNotificationIcon}
                    getColor={getNotificationColor}
                    formatDate={formatDate}
                  />
                ))}
              </View>
            )}

            {readNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lidas</Text>
                {readNotifications.map((notif) => (
                  <NotificationCard
                    key={notif.IDNotificacao}
                    notificacao={notif}
                    onPress={() => {}}
                    onDelete={() => deleteNotification(notif.IDNotificacao)}
                    getIcon={getNotificationIcon}
                    getColor={getNotificationColor}
                    formatDate={formatDate}
                  />
                ))}
              </View>
            )}

            {unreadNotifications.length > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Feather name="check-circle" size={20} color={colors.primary || "#4A90E2"} />
                <Text style={styles.markAllButtonText}>Marcar todas como lidas</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface NotificationCardProps {
  notificacao: Notificacao;
  onPress: () => void;
  onDelete: () => void;
  getIcon: (tipo: string) => string;
  getColor: (tipo: string) => string;
  formatDate: (date: string) => string;
}

function NotificationCard({
  notificacao,
  onPress,
  onDelete,
  getIcon,
  getColor,
  formatDate,
}: NotificationCardProps) {
  const isUnread = notificacao.Status === 'NAO_LIDA';
  const iconColor = getColor(notificacao.Tipo);

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !isUnread && styles.notificationCardRead]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Feather name={getIcon(notificacao.Tipo)} size={24} color={iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !isUnread && styles.notificationTitleRead]}>
            {notificacao.Titulo}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{notificacao.Mensagem}</Text>
        <Text style={styles.notificationDate}>{formatDate(notificacao.createdAt)}</Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="x" size={18} color={colors.muted || "#999"} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text || "#333",
  },
  badge: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: colors.primary || "#4A90E2",
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted || "#666",
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary || "#4A90E2",
  },
  notificationCardRead: {
    opacity: 0.7,
    borderLeftWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || "#333",
    flex: 1,
  },
  notificationTitleRead: {
    fontWeight: '400',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary || "#4A90E2",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.muted || "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: colors.muted || "#999",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary || "#4A90E2",
    gap: 8,
  },
  markAllButtonText: {
    color: colors.primary || "#4A90E2",
    fontSize: 16,
    fontWeight: '600',
  },
});

