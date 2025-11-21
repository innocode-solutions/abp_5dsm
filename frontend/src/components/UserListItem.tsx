import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import colors from '../theme/colors';
import { CreateUserResponse } from '../service/userService';

interface UserListItemProps {
    user: CreateUserResponse;
}

export default function UserListItem({ user }: UserListItemProps) {
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
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.Role) + '20' }]}>
                    <Text style={[styles.roleText, { color: getRoleColor(user.Role) }]}>
                        {getRoleLabel(user.Role)}
                    </Text>
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
});
