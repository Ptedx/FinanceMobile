import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, IconButton, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/financeStore';
import { useThemeStore } from '../hooks/useTheme';
import { spacing, typography } from '../theme';
import { INCOME_CATEGORIES } from '../constants';
import { IncomeCategory, GoalAllocation } from '../types';
import { format } from 'date-fns';

const incomeSchema = z.object({
  value: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  isRecurring: z.boolean(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

export const AddIncomeScreen = ({ navigation }: any) => {
  const { theme } = useThemeStore();
  const { addIncome, goals, updateGoal } = useFinanceStore();
  const [date, setDate] = useState(new Date());
  const [goalAllocations, setGoalAllocations] = useState<GoalAllocation[]>([]);
  const [showGoalAllocation, setShowGoalAllocation] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      value: '',
      description: '',
      category: '',
      isRecurring: false,
    },
  });

  const incomeValue = watch('value');
  const parsedValue = parseFloat(incomeValue?.replace(',', '.') || '0');

  const allocatedTotal = goalAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  const remainingAmount = parsedValue - allocatedTotal;

  const activeGoals = goals.filter(g => g.type === 'save' && g.currentAmount < g.targetAmount);

  const handleGoalAllocation = (goalId: string, amount: string) => {
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    
    const existingIndex = goalAllocations.findIndex(a => a.goalId === goalId);
    
    if (parsedAmount === 0) {
      setGoalAllocations(goalAllocations.filter(a => a.goalId !== goalId));
    } else if (existingIndex >= 0) {
      const newAllocations = [...goalAllocations];
      newAllocations[existingIndex] = { goalId, amount: parsedAmount };
      setGoalAllocations(newAllocations);
    } else {
      setGoalAllocations([...goalAllocations, { goalId, amount: parsedAmount }]);
    }
  };

  const getAllocationForGoal = (goalId: string): number => {
    return goalAllocations.find(a => a.goalId === goalId)?.amount || 0;
  };

  const onSubmit = async (data: IncomeFormData) => {
    const income = {
      category: data.category as IncomeCategory,
      value: parsedValue,
      date: format(date, 'yyyy-MM-dd'),
      isRecurring: data.isRecurring,
      description: data.description,
      goalAllocations: goalAllocations.length > 0 ? goalAllocations : undefined,
    };

    await addIncome(income);

    for (const allocation of goalAllocations) {
      const goal = goals.find(g => g.id === allocation.goalId);
      if (goal) {
        await updateGoal(goal.id, goal.currentAmount + allocation.amount);
      }
    }

    navigation.goBack();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    card: {
      marginBottom: spacing.md,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      ...typography.h3,
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: spacing.sm,
    },
    errorText: {
      ...typography.caption,
      color: theme.colors.error,
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    categoryChipActive: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.success,
    },
    categoryLabel: {
      ...typography.bodySmall,
      color: theme.colors.onSurface,
      marginLeft: -spacing.xs,
    },
    categoryLabelActive: {
      color: '#fff',
    },
    recurringRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recurringTitle: {
      ...typography.body,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    recurringSubtitle: {
      ...typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    goalButton: {
      marginTop: spacing.sm,
    },
    goalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      padding: spacing.sm,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    goalInfo: {
      flex: 1,
    },
    goalTitle: {
      ...typography.body,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    goalProgress: {
      ...typography.caption,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    goalInput: {
      width: 120,
      backgroundColor: theme.colors.surface,
    },
    remainingAmount: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: spacing.sm,
      borderRadius: 8,
      backgroundColor: remainingAmount < 0 ? theme.colors.error + '20' : theme.colors.success + '20',
      marginTop: spacing.md,
    },
    remainingLabel: {
      ...typography.body,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    remainingValue: {
      ...typography.body,
      color: remainingAmount < 0 ? theme.colors.error : theme.colors.success,
      fontWeight: '600',
    },
    submitButton: {
      marginTop: spacing.md,
    },
    submitButtonContent: {
      paddingVertical: spacing.sm,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Valor</Text>
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, value } }) => (
            <TextInput
              mode="outlined"
              label="R$"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={!!errors.value}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.success}
            />
          )}
        />
        {errors.value && <Text style={styles.errorText}>{errors.value.message}</Text>}

        <Text style={styles.sectionTitle}>Descrição (opcional)</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              mode="outlined"
              label="Ex: Salário de dezembro"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.success}
            />
          )}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Categoria</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View style={styles.categoriesGrid}>
              {INCOME_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    value === cat.value && styles.categoryChipActive,
                  ]}
                  onPress={() => onChange(cat.value)}
                >
                  <IconButton
                    icon={cat.icon}
                    size={20}
                    iconColor={value === cat.value ? '#fff' : theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      value === cat.value && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
      </Card>

      {parsedValue > 0 && activeGoals.length > 0 && (
        <Card style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={styles.sectionTitle}>Alocar para Metas</Text>
            <Button
              mode="text"
              onPress={() => setShowGoalAllocation(!showGoalAllocation)}
              textColor={theme.colors.success}
            >
              {showGoalAllocation ? 'Ocultar' : 'Mostrar'}
            </Button>
          </View>

          {showGoalAllocation && (
            <>
              {activeGoals.map(goal => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgress}>
                      R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                    </Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    label="R$"
                    value={getAllocationForGoal(goal.id) > 0 ? getAllocationForGoal(goal.id).toString() : ''}
                    onChangeText={(text) => handleGoalAllocation(goal.id, text)}
                    keyboardType="decimal-pad"
                    style={styles.goalInput}
                    dense
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.success}
                  />
                </View>
              ))}

              <View style={styles.remainingAmount}>
                <Text style={styles.remainingLabel}>Valor Restante:</Text>
                <Text style={styles.remainingValue}>
                  R$ {remainingAmount.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </Card>
      )}

      <Card style={styles.card}>
        <Controller
          control={control}
          name="isRecurring"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.recurringRow}
              onPress={() => onChange(!value)}
            >
              <View>
                <Text style={styles.recurringTitle}>Receita Recorrente</Text>
                <Text style={styles.recurringSubtitle}>
                  Esta receita se repete mensalmente
                </Text>
              </View>
              <IconButton
                icon={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
                iconColor={theme.colors.success}
                size={24}
              />
            </TouchableOpacity>
          )}
        />
      </Card>

      {remainingAmount < 0 && (
        <Text style={[styles.errorText, { color: theme.colors.error, marginTop: spacing.md }]}>
          O total alocado não pode exceder o valor da receita!
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        buttonColor={theme.colors.success}
        disabled={remainingAmount < 0 || parsedValue === 0}
      >
        Adicionar Receita
      </Button>
    </ScrollView>
  );
};
