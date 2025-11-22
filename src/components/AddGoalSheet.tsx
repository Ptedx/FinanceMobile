import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, typography } from '../theme';
import { Goal } from '../types';
import { formatCurrency, parseCurrency } from '../utils/formatters';

interface AddGoalSheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
    initialGoal?: Goal;
    onDelete?: (id: string) => Promise<void>;
}

export const AddGoalSheet: React.FC<AddGoalSheetProps> = ({
    visible,
    onClose,
    onSave,
    initialGoal,
    onDelete,
}) => {
    const theme = useTheme();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
    const [type, setType] = useState<'save' | 'spend_limit'>('save');
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (initialGoal) {
            setTitle(initialGoal.title);
            setTargetAmount(formatCurrency(initialGoal.targetAmount));
            setTargetDate(initialGoal.targetDate ? new Date(initialGoal.targetDate) : undefined);
            setType(initialGoal.type);
        } else {
            resetForm();
        }
    }, [initialGoal, visible]);

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setTargetDate(undefined);
        setType('save');
    };

    const handleSave = async () => {
        if (!title || !targetAmount) return;

        await onSave({
            title,
            targetAmount: parseCurrency(targetAmount),
            currentAmount: initialGoal ? initialGoal.currentAmount : 0,
            targetDate: targetDate ? targetDate.toISOString().split('T')[0] : '',
            type,
        });
        onClose();
        resetForm();
    };

    const handleDelete = async () => {
        if (initialGoal && onDelete) {
            await onDelete(initialGoal.id);
            onClose();
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || targetDate;
        setShowDatePicker(Platform.OS === 'ios');
        setTargetDate(currentDate);
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('pt-BR');
    };

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        <View style={styles.sheet}>
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    {initialGoal ? 'Editar Meta' : 'Nova Meta'}
                                </Text>
                                <IconButton icon="close" onPress={onClose} />
                            </View>

                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                                <Text style={styles.label}>Título</Text>
                                <TextInput
                                    mode="outlined"
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Ex: Viagem, Carro Novo"
                                    style={styles.input}
                                />

                                <Text style={styles.label}>Valor Alvo</Text>
                                <TextInput
                                    mode="outlined"
                                    value={targetAmount}
                                    onChangeText={(text) => {
                                        const numericValue = parseCurrency(text);
                                        setTargetAmount(formatCurrency(numericValue));
                                    }}
                                    keyboardType="numeric"
                                    placeholder="R$ 0,00"
                                    label="Valor Alvo"
                                    style={styles.input}
                                />

                                <Text style={styles.label}>Prazo (Opcional)</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <View pointerEvents="none">
                                        <TextInput
                                            mode="outlined"
                                            value={formatDate(targetDate)}
                                            placeholder="DD/MM/YYYY"
                                            style={styles.input}
                                            editable={false}
                                            right={<TextInput.Icon icon="calendar" />}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={targetDate || new Date()}
                                        mode="date"
                                        is24Hour={true}
                                        display="default"
                                        onChange={onDateChange}
                                    />
                                )}

                                <Button
                                    mode="contained"
                                    onPress={handleSave}
                                    style={styles.saveButton}
                                    disabled={!title || !targetAmount}
                                >
                                    Salvar
                                </Button>

                                {initialGoal && onDelete && (
                                    <Button
                                        mode="outlined"
                                        onPress={handleDelete}
                                        style={styles.deleteButton}
                                        textColor={theme.colors.error}
                                    >
                                        Excluir Meta
                                    </Button>
                                )}
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        sheet: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: spacing.md,
            maxHeight: '90%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        title: {
            ...typography.h3,
            color: theme.colors.onSurface,
        },
        content: {
            marginBottom: spacing.xl,
        },
        label: {
            ...typography.bodySmall,
            color: theme.colors.onSurfaceVariant,
            marginBottom: spacing.xs,
        },
        input: {
            marginBottom: spacing.md,
            backgroundColor: theme.colors.surface,
        },
        saveButton: {
            marginTop: spacing.sm,
        },
        deleteButton: {
            marginTop: spacing.sm,
            borderColor: theme.colors.error,
        },
    });
