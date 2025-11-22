import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, SegmentedButtons } from 'react-native-paper';
import { spacing, typography } from '../theme';
import { Goal } from '../types';

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
    const [deadline, setDeadline] = useState('');
    const [type, setType] = useState<'save' | 'spend'>('save');

    useEffect(() => {
        if (initialGoal) {
            setTitle(initialGoal.title);
            setTargetAmount(initialGoal.targetAmount.toString());
            setDeadline(initialGoal.deadline || '');
            setType(initialGoal.type);
        } else {
            resetForm();
        }
    }, [initialGoal, visible]);

    const resetForm = () => {
        setTitle('');
        setTargetAmount('');
        setDeadline('');
        setType('save');
    };

    const handleSave = async () => {
        if (!title || !targetAmount) return;

        await onSave({
            title,
            targetAmount: parseFloat(targetAmount.replace(',', '.')),
            currentAmount: initialGoal ? initialGoal.currentAmount : 0,
            deadline: deadline || undefined,
            type,
            status: 'active',
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

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {initialGoal ? 'Editar Meta' : 'Nova Meta'}
                        </Text>
                        <IconButton icon="close" onPress={onClose} />
                    </View>

                    <ScrollView style={styles.content}>
                        <Text style={styles.label}>Tipo de Meta</Text>
                        <SegmentedButtons
                            value={type}
                            onValueChange={value => setType(value as 'save' | 'spend')}
                            buttons={[
                                { value: 'save', label: 'Economizar' },
                                { value: 'spend', label: 'Gastar' },
                            ]}
                            style={styles.input}
                        />

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
                            onChangeText={setTargetAmount}
                            keyboardType="decimal-pad"
                            placeholder="0,00"
                            left={<TextInput.Affix text="R$ " />}
                            style={styles.input}
                        />

                        <Text style={styles.label}>Prazo (Opcional)</Text>
                        <TextInput
                            mode="outlined"
                            value={deadline}
                            onChangeText={setDeadline}
                            placeholder="YYYY-MM-DD"
                            style={styles.input}
                        />

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
                    </ScrollView>
                </View>
            </View>
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
