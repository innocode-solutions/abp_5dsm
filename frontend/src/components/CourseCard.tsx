import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import Card from './Card';

interface CourseCardProps {
    title: string;
    description?: string;
    onEdit: () => void;
}

export default function CourseCard({ title, description, onEdit }: CourseCardProps) {
    return (
        <Card style={styles.card}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Feather name="book-open" size={24} color={colors.primary || '#000'} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {description && <Text style={styles.description} numberOfLines={1}>{description}</Text>}
                </View>
                <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                    <Feather name="edit-2" size={20} color={colors.text || '#000'} />
                </TouchableOpacity>
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
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F5F5F5', // Light gray background for icon
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
    },
    editButton: {
        padding: 8,
    },
});
