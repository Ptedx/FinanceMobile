import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/financeStore';
import { theme, spacing, typography } from '../theme';
import { getCategoryColor, getCategoryLabel, getPaymentMethodLabel } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense } from '../types';

export const TimelineScreen = () => {
  const { expenses, deleteExpense } = useFinanceStore();

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card style={styles.expenseCard} variant="outlined">
      <View style={styles.expenseHeader}>
        <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]} />
        <View style={styles.expenseInfo}>
          <Text style={styles.categoryLabel}>{getCategoryLabel(item.category)}</Text>
          <Text style={styles.date}>
            {format(new Date(item.date), "d 'de' MMMM", { locale: ptBR })}
          </Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.value}>R$ {item.value.toFixed(2)}</Text>
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => deleteExpense(item.id)}
          />
        </View>
      </View>
      
      <View style={styles.expenseDetails}>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            {getPaymentMethodLabel(item.paymentMethod)}
          </Text>
          {item.isRecurring && (
            <View style={styles.recurringBadge}>
              <Text style={styles.recurringText}>Recorrente</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nenhum gasto registrado ainda.{'\n'}
              Toque em + para adicionar seu primeiro gasto.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: spacing.md,
  },
  expenseCard: {
    marginBottom: spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryLabel: {
    ...typography.body,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  date: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  expenseDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  description: {
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  recurringBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurringText: {
    ...typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
