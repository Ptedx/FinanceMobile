import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { IconButton, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/financeStore';
import { useThemeStore } from '../hooks/useTheme';
import { spacing, typography } from '../theme';
import { getCategoryColor, getCategoryLabel, getPaymentMethodLabel, getIncomeCategoryLabel } from '../constants';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense, Income } from '../types';

type Transaction = (Expense & { type: 'expense' }) | (Income & { type: 'income' });

export const TimelineScreen = ({ navigation }: any) => {
  const { theme } = useThemeStore();
  const { expenses, incomes, deleteExpense, deleteIncome } = useFinanceStore();
  const [viewMode, setViewMode] = useState<'all' | 'expenses' | 'incomes'>('all');
  const [period, setPeriod] = useState<number | 'all'>(1);
  const [customMonths, setCustomMonths] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getDateRange = (p: number | 'all') => {
    const now = new Date();
    if (p === 'all') {
      return { start: new Date(0), end: new Date() };
    }
    return { start: startOfMonth(subMonths(now, p - 1)), end: endOfMonth(now) };
  };

  const transactions = useMemo(() => {
    const { start, end } = getDateRange(period);

    let txs: Transaction[] = [];

    if (viewMode === 'all' || viewMode === 'expenses') {
      txs = [...txs, ...expenses.map(e => ({ ...e, type: 'expense' as const }))];
    }

    if (viewMode === 'all' || viewMode === 'incomes') {
      txs = [...txs, ...incomes.map(i => ({ ...i, type: 'income' as const }))];
    }

    return txs
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes, viewMode, period]);

  const handleEdit = (transaction: Transaction) => {
    if (transaction.type === 'expense') {
      navigation.navigate('AddExpense', { expense: transaction });
    } else {
      navigation.navigate('AddIncome', { income: transaction });
    }
  };

  const handleDelete = (transaction: Transaction) => {
    if (transaction.type === 'expense') {
      deleteExpense(transaction.id);
    } else {
      deleteIncome(transaction.id);
    }
    setSelectedTransaction(null);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'expense';
    const categoryLabel = isExpense
      ? getCategoryLabel((item as Expense).category)
      : getIncomeCategoryLabel((item as Income).category);
    const categoryColor = isExpense
      ? getCategoryColor((item as Expense).category)
      : theme.colors.success;

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} variant="outlined">
        <View style={styles.header}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={[styles.categoryLabel, { color: theme.colors.onSurface }]}>
                {categoryLabel}
              </Text>
              {isExpense ? (
                <Icon name="arrow-down" size={16} color={theme.colors.error} />
              ) : (
                <Icon name="arrow-up" size={16} color={theme.colors.success} />
              )}
            </View>
            <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
              {format(new Date(item.date), "d 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.right}>
            <Text
              style={[
                styles.value,
                { color: isExpense ? theme.colors.error : theme.colors.success }
              ]}
            >
              {isExpense ? '-' : '+'} R$ {item.value.toFixed(2)}
            </Text>
            <View style={styles.actions}>
              <IconButton
                icon="pencil-outline"
                size={18}
                iconColor={theme.colors.primary}
                onPress={() => handleEdit(item)}
              />
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor={theme.colors.error}
                onPress={() => handleDelete(item)}
              />
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={[styles.description, { color: theme.colors.onSurface }]}>
            {item.description}
          </Text>
        )}

        <View style={[styles.detailsRow, { borderTopColor: theme.colors.outline }]}>
          {isExpense && (
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {getPaymentMethodLabel((item as Expense).paymentMethod)}
            </Text>
          )}
          {item.isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.recurringText, { color: theme.colors.primary }]}>
                Recorrente
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    filters: {
      padding: spacing.md,
      gap: spacing.md,
    },
    periodContainer: {
      gap: spacing.sm,
    },
    chipsContainer: {
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    chip: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    customInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      height: 40,
      width: '100%',
    },
    customInput: {
      ...typography.body,
      flex: 1,
      padding: 0,
    },
    customInputLabel: {
      ...typography.bodySmall,
      marginLeft: spacing.xs,
    },
    list: {
      padding: spacing.md,
    },
    card: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.sm,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    categoryLabel: {
      ...typography.body,
      fontWeight: '500',
    },
    date: {
      ...typography.bodySmall,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
    },
    value: {
      ...typography.body,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      marginTop: -8,
    },
    description: {
      ...typography.bodySmall,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
    },
    detailText: {
      ...typography.caption,
    },
    recurringBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
    },
    recurringText: {
      ...typography.caption,
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

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as any)}
          buttons={[
            { value: 'all', label: 'Todos' },
            { value: 'expenses', label: 'Gastos' },
            { value: 'incomes', label: 'Receitas' },
          ]}
        />

        <View style={styles.periodContainer}>
          <View style={[styles.customInputContainer, { borderColor: theme.colors.outline }]}>
            <TextInput
              value={customMonths}
              onChangeText={(text) => {
                setCustomMonths(text);
                const val = parseInt(text);
                if (!isNaN(val) && val > 0) {
                  setPeriod(val);
                }
              }}
              placeholder="Digite a quantidade de meses..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              style={[styles.customInput, { color: theme.colors.onSurface }]}
            />
            <Text style={[styles.customInputLabel, { color: theme.colors.onSurfaceVariant }]}>meses</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            {[1, 3, 6, 12].map((months) => (
              <Chip
                key={months}
                selected={period === months}
                onPress={() => { setPeriod(months); setCustomMonths(''); }}
                style={[styles.chip, period === months && { backgroundColor: theme.colors.primary + '20' }]}
                textStyle={{ color: period === months ? theme.colors.primary : theme.colors.onSurface }}
                showSelectedOverlay
              >
                {months === 12 ? '1 Ano' : `${months} Meses`}
              </Chip>
            ))}
            <Chip
              selected={period === 'all'}
              onPress={() => { setPeriod('all'); setCustomMonths(''); }}
              style={[styles.chip, period === 'all' && { backgroundColor: theme.colors.primary + '20' }]}
              textStyle={{ color: period === 'all' ? theme.colors.primary : theme.colors.onSurface }}
              showSelectedOverlay
            >
              Tudo
            </Chip>
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nenhuma transação encontrada no período selecionado.
            </Text>
          </View>
        }
      />
    </View>
  );
};

