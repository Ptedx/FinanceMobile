import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, FAB, IconButton, Icon } from 'react-native-paper';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { AddBudgetSheet } from '../components/AddBudgetSheet';
import { getCategoryLabel, getCategoryIcon, getCategoryColor } from '../constants';
import { Budget } from '../types';

export const BudgetsScreen = () => {
  const theme = useTheme();
  const { getBudgetProgress, addBudget, updateBudget, deleteBudget } = useFinanceStore();
  const budgetProgress = getBudgetProgress();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | undefined>(undefined);

  const handleOpenAdd = () => {
    setSelectedBudget(undefined);
    setSheetVisible(true);
  };

  const handleOpenEdit = (category: string) => {
    // Find the original budget object from the store (not the progress object)
    const budget = useFinanceStore.getState().budgets.find(b => b.category === category);
    if (budget) {
      setSelectedBudget(budget);
      setSheetVisible(true);
    }
  };

  const handleSave = async (budgetData: Omit<Budget, 'id' | 'createdAt'>) => {
    if (selectedBudget) {
      await updateBudget(selectedBudget.id, budgetData);
    } else {
      await addBudget(budgetData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBudget(id);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Meus Orçamentos</Text>

        {budgetProgress.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Você ainda não definiu nenhum orçamento.
            </Text>
            <Text style={styles.emptySubtext}>
              Toque no botão + para começar a controlar seus gastos por categoria.
            </Text>
          </View>
        ) : (
          budgetProgress.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.card}
              onPress={() => handleOpenEdit(item.category)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.categoryInfo}>
                  <Icon source={getCategoryIcon(item.category)} size={24} color={getCategoryColor(item.category)} />
                  <Text style={styles.categoryName}>{getCategoryLabel(item.category)}</Text>
                </View>
                <Text style={[
                  styles.percentage,
                  { color: item.status === 'exceeded' ? theme.colors.error : getCategoryColor(item.category) }
                ]}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>

              <ProgressBar
                value={item.spent}
                max={item.limitAmount}
                showPercentage={false}
                color={item.status === 'exceeded' ? theme.colors.error : item.status === 'warning' ? (theme.colors as any).warning : getCategoryColor(item.category)}
              />

              <View style={styles.cardFooter}>
                <Text style={styles.amountText}>
                  Gasto: R$ {item.spent.toFixed(2)}
                </Text>
                <Text style={styles.limitText}>
                  Limite: R$ {item.limitAmount.toFixed(2)}
                </Text>
              </View>

              {/* Recurrence indicator could go here if we had that info in budgetProgress, 
                  but for now user sees it when editing */}
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleOpenAdd}
        label="Novo Orçamento"
        color={theme.colors.surface}
      />

      <AddBudgetSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        initialBudget={selectedBudget}
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
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    categoryName: {
      ...typography.h3,
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    percentage: {
      ...typography.h3,
      fontSize: 16,
      fontWeight: 'bold',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    amountText: {
      ...typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    limitText: {
      ...typography.bodySmall,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
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
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      ...typography.body,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    bottomPadding: {
      height: 80,
    },
    fab: {
      position: 'absolute',
      bottom: spacing.md,
      right: spacing.md,
      backgroundColor: theme.colors.primary,
    },
  });
