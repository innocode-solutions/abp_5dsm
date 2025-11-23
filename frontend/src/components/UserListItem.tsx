import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Card from './Card';
import colors from '../theme/colors';
import { CreateUserResponse } from '../service/userService';

interface UserListItemProps {
    user: CreateUserResponse;
    onEdit?: (user: CreateUserResponse) => void;
    onDelete?: (user: CreateUserResponse) => void;
}

export default function UserListItem({ user, onEdit, onDelete }: UserListItemProps) {
    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'STUDENT':
                return 'Aluno';
            case 'TEACHER':
                return 'Professor';
            case 'ADMIN':
                return 'Administrador';
            default:
                return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'STUDENT':
                return colors.primary;
            case 'TEACHER':
                return colors.excellent;
            case 'ADMIN':
                return '#ef4444'; // Red for admin
            default:
                return colors.text;
        }
    };

    return (
        <Card style={styles.card}>
            <View style={styles.content}>
                <View style={styles.info}>
                    <Text style={styles.name}>{user.name || 'Usuário sem nome'}</Text>
                    <Text style={styles.email}>{user.Email}</Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.Role) + '20' }]}>
                        <Text style={[styles.roleText, { color: getRoleColor(user.Role) }]}>
                            {getRoleLabel(user.Role)}
                        </Text>
                    </View>
                    {(onEdit || onDelete) && (
                        <View style={styles.actions}>
                            {onEdit && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onEdit(user)}
                                    accessibilityLabel="Editar usuário"
                                >
                                    <Feather name="edit-2" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            {onDelete && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onDelete(user)}
                                    accessibilityLabel="Excluir usuário"
                                >
                                    <Feather name="trash-2" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#6b7280',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
});
