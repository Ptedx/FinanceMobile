import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { useFinanceStore } from '../store/financeStore';
import { theme, spacing, typography } from '../theme';
import { EXPENSE_CATEGORIES, getCategoryColor, getCategoryLabel } from '../constants';
import { ExpenseCategory } from '../types';
import { format } from 'date-fns';

export const BudgetsScreen = () => {
  const { budgets, setBudget, getBudgetProgress } = useFinanceStore();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState('');

  const budgetProgress = getBudgetProgress();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const handleSetBudget = async () => {
    if (selectedCategory && amount) {
      await setBudget({
        category: selectedCategory,
        limitAmount: parseFloat(amount.replace(',', '.')),
        month: currentMonth,
      });
      setSelectedCategory(null);
      setAmount('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Definir Orçamento</Text>
        
        <View style={styles.categoriesGrid}>
          {EXPENSE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: getCategoryColor(cat.value),
                  },
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <IconButton
                  icon={cat.icon}
                  size={20}
                  iconColor={isSelected ? '#fff' : getCategoryColor(cat.value)}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedCategory && (
          <>
            <TextInput
              mode="outlined"
              label="Limite Mensal (R$)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Button mode="contained" onPress={handleSetBudget}>
              Salvar Orçamento
            </Button>
          </>
        )}
      </Card>

      {budgetProgress.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.title}>Orçamentos Atuais</Text>
          {budgetProgress.map(budget => (
            <View key={budget.category} style={styles.budgetItem}>
              <ProgressBar
                value={budget.spent}
                max={budget.limitAmount}
                label={getCategoryLabel(budget.category)}
                showPercentage
              />
              <Text style={styles.budgetAmount}>
                R$ {budget.spent.toFixed(2)} / R$ {budget.limitAmount.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: theme.colors.onSurface,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  categoryLabel: {
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    marginLeft: -spacing.xs,
  },
  categoryLabelActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  budgetItem: {
    marginBottom: spacing.md,
  },
  budgetAmount: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});
