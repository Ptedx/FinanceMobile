import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, IconButton, SegmentedButtons, useTheme } from 'react-native-paper';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/financeStore';
import { useFinanceEngine } from '../hooks/useFinanceEngine';
import { spacing, typography } from '../theme';
import { format } from 'date-fns';

export const GoalsScreen = () => {
  const theme = useTheme();
  const { goals, addGoal, deleteGoal } = useFinanceStore();
  const { calculateGoalETA } = useFinanceEngine();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [type, setType] = useState<'save' | 'spend_limit'>('save');

  const handleAddGoal = async () => {
    if (title && targetAmount) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      
      await addGoal({
        title,
        targetAmount: parseFloat(targetAmount.replace(',', '.')),
        currentAmount: 0,
        targetDate: format(futureDate, 'yyyy-MM-dd'),
        type,
      });
      
      setTitle('');
      setTargetAmount('');
    }
  };

  return (
    <ScrollView style={styles(theme).container} contentContainerStyle={styles(theme).content}>
      <Card style={styles(theme).card}>
        <Text style={styles(theme).title}>Nova Meta</Text>
        
        <SegmentedButtons
          value={type}
          onValueChange={(value) => setType(value as any)}
          buttons={[
            { value: 'save', label: 'Economizar' },
            { value: 'spend_limit', label: 'Limite de Gastos' },
          ]}
          style={styles(theme).segmented}
        />

        <TextInput
          mode="outlined"
          label="Título da Meta"
          value={title}
          onChangeText={setTitle}
          style={styles(theme).input}
        />

        <TextInput
          mode="outlined"
          label="Valor Alvo (R$)"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
          style={styles(theme).input}
        />

        <Button mode="contained" onPress={handleAddGoal}>
          Adicionar Meta
        </Button>
      </Card>

      {goals.length > 0 && (
        <Card style={styles(theme).card}>
          <Text style={styles(theme).title}>Minhas Metas</Text>
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const eta = calculateGoalETA(goal);
            
            return (
              <View key={goal.id} style={styles(theme).goalItem}>
                <View style={styles(theme).goalHeader}>
                  <View style={styles(theme).goalInfo}>
                    <Text style={styles(theme).goalTitle}>{goal.title}</Text>
                    <Text style={styles(theme).goalSubtitle}>
                      R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => deleteGoal(goal.id)}
                  />
                </View>
                
                <View style={styles(theme).progressContainer}>
                  <View style={styles(theme).progressBarBg}>
                    <View
                      style={[
                        styles(theme).progressBarFill,
                        { width: `${Math.min(progress, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles(theme).progressText}>{progress.toFixed(0)}%</Text>
                </View>
                
                <Text style={styles(theme).etaText}>ETA: {eta}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = (theme: any) => StyleSheet.create({
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
  segmented: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  goalItem: {
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...typography.body,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  goalSubtitle: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  progressText: {
    ...typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
    width: 40,
  },
  etaText: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});
