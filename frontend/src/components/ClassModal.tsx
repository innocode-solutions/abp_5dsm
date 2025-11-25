import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { CreateClassData } from '../service/classService';
import { courseService, Course } from '../service/courseService';

interface ClassModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: CreateClassData) => Promise<void>;
}

export default function ClassModal({ visible, onClose, onSave }: ClassModalProps) {
    const [courseId, setCourseId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [workload, setWorkload] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [showCoursePicker, setShowCoursePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            loadCourses();
            setName('');
            setCode('');
            setWorkload('');
            setCourseId('');
            setError('');
        }
    }, [visible]);

    const loadCourses = async () => {
        setLoadingCourses(true);
        try {
            const response = await courseService.getAll(1, 100, '');
            setCourses(response.data);
        } catch (err) {
            console.error('Erro ao carregar cursos:', err);
            setError('Erro ao carregar cursos. Tente novamente.');
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleSave = async () => {
        if (!courseId) {
            setError('Selecione um curso.');
            return;
        }
        if (!name.trim()) {
            setError('O nome da disciplina é obrigatório.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data: CreateClassData = {
                IDCurso: courseId,
                NomeDaDisciplina: name.trim(),
                CodigoDaDisciplina: code.trim() || undefined,
                CargaHoraria: workload ? parseInt(workload) : undefined,
                Ativa: true,
            };
            await onSave(data);
            onClose();
        } catch (err: any) {
            console.error('Error saving class:', err);
            setError(err.message || 'Erro ao salvar turma. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const selectedCourse = courses.find(c => c.IDCurso === courseId);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Adicionar Turma</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={colors.muted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Curso *</Text>
                            {loadingCourses ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={styles.loadingText}>Carregando cursos...</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowCoursePicker(!showCoursePicker)}
                                >
                                    <Text style={[styles.pickerText, !selectedCourse && styles.pickerPlaceholder]}>
                                        {selectedCourse ? selectedCourse.NomeDoCurso : 'Selecione um curso'}
                                    </Text>
                                    <Feather name={showCoursePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                            {showCoursePicker && !loadingCourses && (
                                <View style={styles.pickerOptions}>
                                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                                        {courses.map((course) => (
                                            <TouchableOpacity
                                                key={course.IDCurso}
                                                style={[
                                                    styles.pickerOption,
                                                    courseId === course.IDCurso && styles.pickerOptionSelected
                                                ]}
                                                onPress={() => {
                                                    setCourseId(course.IDCurso);
                                                    setShowCoursePicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.pickerOptionText,
                                                    courseId === course.IDCurso && styles.pickerOptionTextSelected
                                                ]}>
                                                    {course.NomeDoCurso}
                                                </Text>
                                                {courseId === course.IDCurso && (
                                                    <Feather name="check" size={20} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome da Disciplina *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Ex: Algoritmos e Estruturas de Dados"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Código da Disciplina (Opcional)</Text>
                            <TextInput
                                style={styles.input}
                                value={code}
                                onChangeText={setCode}
                                placeholder="Ex: AED001"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Carga Horária (Opcional)</Text>
                            <TextInput
                                style={styles.input}
                                value={workload}
                                onChangeText={setWorkload}
                                placeholder="Ex: 60"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        paddingBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pickerButton: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: colors.text,
        flex: 1,
    },
    pickerPlaceholder: {
        color: '#9CA3AF',
    },
    pickerOptions: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    pickerScroll: {
        maxHeight: 200,
    },
    pickerOption: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerOptionSelected: {
        backgroundColor: colors.bg,
    },
    pickerOptionText: {
        fontSize: 16,
        color: colors.text,
        flex: 1,
    },
    pickerOptionTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    loadingText: {
        fontSize: 14,
        color: colors.muted,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

