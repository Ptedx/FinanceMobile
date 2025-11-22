import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, FAB, ProgressBar } from 'react-native-paper';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { AddGoalSheet } from '../components/AddGoalSheet';
import { Goal } from '../types';

export const GoalsScreen = () => {
    const theme = useTheme();
    const { goals, addGoal, updateGoal, deleteGoal } = useFinanceStore();
    const [sheetVisible, setSheetVisible] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);

    const handleOpenAdd = () => {
        setSelectedGoal(undefined);
        setSheetVisible(true);
    };

    const handleOpenEdit = (goal: Goal) => {
        setSelectedGoal(goal);
        setSheetVisible(true);
    };

    const handleSave = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
        if (selectedGoal) {
            await updateGoal(selectedGoal.id, goalData);
            setSheetVisible(false);
        } else {
            await addGoal(goalData);
            setSheetVisible(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteGoal(id);
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Minhas Metas</Text>

                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nenhuma meta definida.</Text>
                        <Text style={styles.emptySubtext}>
                            Crie metas para economizar para seus sonhos!
                        </Text>
                    </View>
                ) : (
                    goals.map((goal) => {
                        const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
                        return (
                            <TouchableOpacity
                                key={goal.id}
                                style={styles.card}
                                onPress={() => handleOpenEdit(goal)}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalAmount}>
                                        R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                                    </Text>
                                </View>
                                <ProgressBar
                                    progress={progress}
                                    color={progress >= 1 ? theme.colors.primary : theme.colors.secondary}
                                    style={styles.progressBar}
                                />
                                <Text style={styles.percentage}>
                                    {(progress * 100).toFixed(0)}% concluído
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleOpenAdd}
                label="Nova Meta"
                color={theme.colors.surface}
            />

            <AddGoalSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onSave={handleSave}
                initialGoal={selectedGoal}
                onDelete={handleDelete}
            />
        </View>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            padding: spacing.md,
            paddingBottom: 80,
        },
        headerTitle: {
            ...typography.h2,
            color: theme.colors.onSurface,
            marginBottom: spacing.lg,
        },
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.outline,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        goalTitle: {
            ...typography.h3,
            fontSize: 18,
            color: theme.colors.onSurface,
        },
        goalAmount: {
            ...typography.bodySmall,
            color: theme.colors.onSurfaceVariant,
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.surfaceVariant,
        },
        percentage: {
            ...typography.caption,
            color: theme.colors.onSurfaceVariant,
            marginTop: spacing.xs,
            textAlign: 'right',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            marginTop: spacing.xl,
        },
        emptyText: {
            ...typography.h3,
            color: theme.colors.onSurface,
            marginBottom: spacing.sm,
        },
        emptySubtext: {
            ...typography.body,
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
        },
        fab: {
            position: 'absolute',
            bottom: spacing.md,
            right: spacing.md,
            backgroundColor: theme.colors.primary,
        },
    });
