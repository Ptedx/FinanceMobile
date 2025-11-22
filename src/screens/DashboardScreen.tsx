import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconButton, FAB, useTheme, SegmentedButtons, Icon } from 'react-native-paper';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { AlertBanner } from '../components/AlertBanner';
import { AnimatedBarChart } from '../components/AnimatedBarChart';
import { NetWorthChart } from '../components/NetWorthChart';
import { TransactionTypeSheet } from '../components/TransactionTypeSheet';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';
import { useFinanceEngine } from '../hooks/useFinanceEngine';
import { spacing, typography } from '../theme';
import { getCategoryColor, getCategoryLabel, getCategoryIcon } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { LoadingScreen } from './LoadingScreen';
import { ErrorRetryScreen } from './ErrorRetryScreen';

export const DashboardScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { alerts, markAlertAsRead, goals, isLoading, error, retry } = useFinanceStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const { dashboardData, getSpendingInsights, getNetWorthHistory, getComparisonWithLastMonth } = useFinanceEngine();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorRetryScreen error={error} onRetry={retry} />;
  }

  const insights = getSpendingInsights();
  const comparison = getComparisonWithLastMonth();
  const netWorthHistory = getNetWorthHistory(selectedPeriod);

  const [sheetVisible, setSheetVisible] = useState(false);

  const categoryData = Object.entries(insights.categoryBreakdown)
    .map(([category, amount]) => ({
      category: category as any,
      label: getCategoryLabel(category as any),
      value: amount,
      color: getCategoryColor(category as any),
      percentage: 0,
    }))
    .sort((a, b) => b.value - a.value);

  const unreadAlerts = alerts
    .filter(a => !a.isRead && !dismissedAlerts.includes(a.id))
    .slice(0, 3);

  const activeGoals = goals
    .map(g => ({ ...g, progress: g.currentAmount / g.targetAmount }))
    .filter(g => g.progress >= 0.5 && g.progress < 1)
    .sort((a, b) => b.progress - a.progress);

  const getMotivationalMessage = (progress: number) => {
    if (progress >= 0.9) return "Quase lá! A reta final!";
    if (progress >= 0.7) return "Falta pouco! Mantenha o foco!";
    return "Você está na metade do caminho! Continue assim!";
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
          <Text style={styles.date}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </Text>
        </View>
        <IconButton icon="bell" size={24} onPress={() => navigation.navigate('Alerts')} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {unreadAlerts.map(alert => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onDismiss={() => handleDismissAlert(alert.id)}
          />
        ))}

        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumo do mês</Text>

          {/* Row 1: Balances */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo Atual</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                R$ {dashboardData.availableBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Projeção</Text>
              <Text style={[styles.summaryValue, { color: (theme.colors as any).warning }]}>
                R$ {dashboardData.projection.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* Row 2: Flows */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                R$ {dashboardData.monthlyIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                R$ {dashboardData.monthlyTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View>
              <Text style={{ ...typography.h3, color: theme.colors.onSurface }}>Crescimento Patrimonial</Text>
              {netWorthHistory.length > 1 && (
                (() => {
                  const startValue = netWorthHistory[0].value;
                  const endValue = netWorthHistory[netWorthHistory.length - 1].value;
                  const diff = endValue - startValue;
                  const percentage = startValue !== 0 ? (diff / Math.abs(startValue)) * 100 : (diff > 0 ? 100 : 0);
                  const isPositive = diff >= 0;

                  return (
                    <Text style={{
                      ...typography.bodySmall,
                      color: isPositive ? theme.colors.success : theme.colors.error,
                      fontWeight: 'bold'
                    }}>
                      {isPositive ? '+' : ''}R$ {diff.toFixed(2)} ({isPositive ? '+' : ''}{percentage.toFixed(1)}%)
                    </Text>
                  );
                })()
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={value => setSelectedPeriod(value as any)}
              buttons={[
                { value: '1D', label: '1D' },
                { value: '7D', label: '7D' },
                { value: '1M', label: '1M' },
                { value: '3M', label: '3M' },
                { value: '6M', label: '6M' },
                { value: '1Y', label: '1A' },
                { value: 'ALL', label: 'Tudo' },
              ]}
              density="medium"
              style={{ minWidth: 300 }}
            />
          </ScrollView>

          {netWorthHistory.length > 1 && !netWorthHistory.some(d => isNaN(d.value) || isNaN(d.date.getTime())) && (
            <NetWorthChart data={netWorthHistory} period={selectedPeriod} />
          )}
        </Card>

        {activeGoals.length > 0 && (
          <Card style={styles.budgetCard}>
            <Text style={styles.cardTitle}>Metas em Progresso</Text>
            {activeGoals.map(goal => (
              <View key={goal.id} style={styles.budgetItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ ...typography.bodySmall, color: theme.colors.onSurface }}>{goal.title}</Text>
                  <Text style={{ ...typography.caption, color: theme.colors.primary, fontWeight: 'bold' }}>
                    {(goal.progress * 100).toFixed(0)}%
                  </Text>
                </View>
                <ProgressBar
                  value={goal.currentAmount}
                  max={goal.targetAmount}
                  showPercentage={false}
                  color={theme.colors.success}
                />
                <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant, marginTop: 4, fontStyle: 'italic' }}>
                  {getMotivationalMessage(goal.progress)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {categoryData.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Gastos por Categoria</Text>
            <AnimatedBarChart data={categoryData} />
          </Card>
        )}

        <Card style={styles.budgetCard}>
          <Text style={styles.cardTitle}>Orçamentos</Text>
          {dashboardData.budgetProgress.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum orçamento definido. Toque em "Orçamentos" para começar.
            </Text>
          ) : (
            dashboardData.budgetProgress.map(budget => (
              <View key={budget.category} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetIconContainer}>
                    <Icon source={getCategoryIcon(budget.category)} size={24} color={getCategoryColor(budget.category)} />
                    <Text style={styles.budgetLabel}>{getCategoryLabel(budget.category)}</Text>
                  </View>
                  <Text style={[styles.budgetPercentage, { color: budget.status === 'exceeded' ? theme.colors.error : theme.colors.primary }]}>
                    {budget.percentage.toFixed(0)}%
                  </Text>
                </View>
                <ProgressBar
                  value={budget.spent}
                  max={budget.limitAmount}
                  showPercentage={false}
                  color={budget.status === 'exceeded' ? theme.colors.error : budget.status === 'warning' ? (theme.colors as any).warning : theme.colors.primary}
                />
                <Text style={styles.budgetAmount}>
                  R$ {budget.spent.toFixed(2)} / R$ {budget.limitAmount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
        color={theme.colors.surface}
      />

      <TransactionTypeSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelectExpense={() => {
          setSheetVisible(false);
          navigation.navigate('AddExpense');
        }}
        onSelectIncome={() => {
          setSheetVisible(false);
          navigation.navigate('AddIncome');
        }}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      paddingTop: spacing.xl,
      backgroundColor: theme.colors.surface,
    },
    greeting: {
      ...typography.h2,
      color: theme.colors.onSurface,
    },
    date: {
      ...typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'capitalize',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
    },
    summaryCard: {
      marginBottom: spacing.md,
    },
    cardTitle: {
      ...typography.h3,
      color: theme.colors.onSurface,
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.outline,
    },
    horizontalDivider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginVertical: spacing.md,
      opacity: 0.5,
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    summaryValue: {
      ...typography.h2,
      color: theme.colors.primary,
      textAlign: 'center',
    },
    chartCard: {
      marginBottom: spacing.md,
    },
    budgetCard: {
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
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    budgetIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    budgetLabel: {
      ...typography.body,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    budgetPercentage: {
      ...typography.body,
      fontWeight: 'bold',
    },
    emptyText: {
      ...typography.body,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginVertical: spacing.md,
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
