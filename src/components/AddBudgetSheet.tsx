import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, useTheme, IconButton, Switch, Icon } from 'react-native-paper';
import { spacing, typography } from '../theme';
import { EXPENSE_CATEGORIES, getCategoryLabel, getCategoryIcon } from '../constants';
import { Budget, ExpenseCategory } from '../types';

interface AddBudgetSheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
    initialBudget?: Budget;
    onDelete?: (id: string) => Promise<void>;
}

export const AddBudgetSheet = ({ visible, onClose, onSave, initialBudget, onDelete }: AddBudgetSheetProps) => {
    const theme = useTheme();
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('food');
    const [isRecurring, setIsRecurring] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialBudget) {
                setAmount(initialBudget.limitAmount.toString());
                setCategory(initialBudget.category);
                setIsRecurring(initialBudget.isRecurring);
            } else {
                setAmount('');
                setCategory('food');
                setIsRecurring(true);
            }
        }
    }, [visible, initialBudget]);

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount))) return;

        setLoading(true);
        try {
            await onSave({
                category,
                limitAmount: Number(amount),
                month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
                isRecurring,
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialBudget || !onDelete) return;
        setLoading(true);
        try {
            await onDelete(initialBudget.id);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
                            {initialBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                        </Text>
                        <IconButton icon="close" onPress={onClose} />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Valor Limite</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            style={styles.input}
                            left={<TextInput.Affix text="R$ " />}
                        />

                        <Text style={styles.label}>Categoria</Text>
                        <View style={styles.categoriesGrid}>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={[
                                        styles.categoryChip,
                                        category === cat.value && styles.selectedCategoryChip,
                                    ]}
                                    onPress={() => setCategory(cat.value)}
                                >
                                    <Icon
                                        source={cat.icon}
                                        size={20}
                                        color={category === cat.value ? theme.colors.onPrimaryContainer : theme.colors.onSurface}
                                    />
                                    <Text
                                        style={[
                                            styles.categoryLabel,
                                            category === cat.value && styles.selectedCategoryLabel,
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.switchContainer}>
                            <View>
                                <Text style={styles.switchLabel}>Orçamento Recorrente</Text>
                                <Text style={styles.switchDescription}>
                                    Renova automaticamente todo mês
                                </Text>
                            </View>
                            <Switch value={isRecurring} onValueChange={setIsRecurring} />
                        </View>

                        <View style={styles.actions}>
                            {initialBudget && onDelete && (
                                <Button
                                    mode="outlined"
                                    onPress={handleDelete}
                                    style={styles.deleteButton}
                                    textColor={theme.colors.error}
                                    loading={loading}
                                >
                                    Excluir
                                </Button>
                            )}
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={loading}
                                disabled={!amount}
                            >
                                Salvar
                            </Button>
                        </View>
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
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
        },
        title: {
            ...typography.h3,
            color: theme.colors.onSurface,
        },
        content: {
            padding: spacing.md,
        },
        label: {
            ...typography.bodySmall,
            color: theme.colors.onSurfaceVariant,
            marginBottom: spacing.xs,
            marginTop: spacing.sm,
        },
        input: {
            backgroundColor: theme.colors.surface,
            marginBottom: spacing.md,
        },
        categoriesGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        categoryChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
            marginBottom: spacing.xs,
        },
        selectedCategoryChip: {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
        },
        categoryLabel: {
            ...typography.bodySmall,
            color: theme.colors.onSurface,
        },
        selectedCategoryLabel: {
            color: theme.colors.onPrimaryContainer,
            fontWeight: 'bold',
        },
        switchContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: spacing.md,
            padding: spacing.sm,
            backgroundColor: theme.colors.surfaceVariant + '20', // Light tint
            borderRadius: 8,
        },
        switchLabel: {
            ...typography.body,
            color: theme.colors.onSurface,
            fontWeight: 'bold',
        },
        switchDescription: {
            ...typography.caption,
            color: theme.colors.onSurfaceVariant,
        },
        actions: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.md,
            marginBottom: spacing.xl,
        },
        saveButton: {
            flex: 1,
        },
        deleteButton: {
            flex: 1,
            borderColor: theme.colors.error,
        },
    });
