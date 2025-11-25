import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { getCategoryColor, getCategoryLabel, getCategoryIcon, INCOME_CATEGORIES } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getInvoiceDates, isExpenseInInvoice } from '../utils/creditCardUtils';
import { formatCurrency } from '../utils/formatters';

import { LoadingScreen } from './LoadingScreen';
import { ErrorRetryScreen } from './ErrorRetryScreen';

export const DashboardScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { alerts, markAlertAsRead, goals, isLoading, error, retry, isValuesVisible, toggleValuesVisibility, creditCards, expenses, incomes } = useFinanceStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('7D');

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const { dashboardData, getSpendingInsights, getNetWorthHistory, getComparisonWithLastMonth } = useFinanceEngine();

  const [sheetVisible, setSheetVisible] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorRetryScreen error={error} onRetry={retry} />;
  }

  const insights = getSpendingInsights();
  const comparison = getComparisonWithLastMonth();
  const netWorthHistory = getNetWorthHistory(selectedPeriod);

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

  const formatValue = (value: number, prefix: string = '') => {
    if (!isValuesVisible) return 'R$ ••••••';
    return formatCurrency(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.name?.split(' ')[0] || 'Usuário';

    if (hour >= 5 && hour < 12) {
      return `Bom dia, ${userName}!`;
    } else if (hour >= 12 && hour < 18) {
      return `Boa tarde, ${userName}!`;
    } else {
      return `Boa noite, ${userName}!`;
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            icon={isValuesVisible ? "eye" : "eye-off"}
            size={24}
            onPress={toggleValuesVisibility}
          />
          <IconButton icon="bell" size={24} onPress={() => navigation.navigate('Alerts')} />
        </View>
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

          {/* Row 1: Net Worth & Available Balance */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Patrimônio</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {formatValue(dashboardData.netWorth)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo Disponível</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {formatValue(dashboardData.availableBalance)}
              </Text>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* Row 2: Flows */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: (theme.colors as any).success }]}>
                {formatValue(dashboardData.monthlyIncome)}
              </Text>
              {isValuesVisible && (
                <View style={{ marginTop: 8, width: '100%', paddingHorizontal: 12 }}>
                  {INCOME_CATEGORIES.map(cat => {
                    const catTotal = incomes
                      .filter(i => i.category === cat.value && new Date(i.date).getMonth() === new Date().getMonth())
                      .reduce((sum, i) => sum + i.value, 0);

                    if (catTotal === 0) return null;

                    return (
                      <View key={cat.value} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>{cat.label}:</Text>
                        <Text style={{ ...typography.caption, color: theme.colors.onSurface }}>
                          {formatCurrency(catTotal)}
                        </Text>
                      </View>
                    );
                  })}
                  <Text style={{ ...typography.caption, color: theme.colors.outline, textAlign: 'center', marginTop: 4, fontSize: 10 }}>
                    (Total do Mês)
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                {formatValue(dashboardData.monthlyTotal)}
              </Text>
              {isValuesVisible && (
                <View style={{ marginTop: 8, width: '100%', paddingHorizontal: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>Débito:</Text>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurface }}>
                      {formatCurrency(expenses.filter(e => !e.creditCardId && new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.value, 0))}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>Crédito:</Text>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurface }}>
                      {formatCurrency(expenses.filter(e => !!e.creditCardId && new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.value, 0))}
                    </Text>
                  </View>
                  <Text style={{ ...typography.caption, color: theme.colors.outline, textAlign: 'center', marginTop: 4, fontSize: 10 }}>
                    (Total do Mês)
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ ...typography.h3, color: theme.colors.onSurface, marginBottom: 0 }}>Meus Cartões</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => navigation.navigate('AddCreditCard')}
            />
          </View>

          {creditCards.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
          ) : (
            creditCards.map(card => {
              const { startDate, endDate } = getInvoiceDates(card.closingDay);

              const invoice = expenses
                .filter(e =>
                  e.creditCardId === card.id &&
                  isExpenseInInvoice(new Date(e.date), startDate, endDate)
                )
                .reduce((sum, e) => sum + e.value, 0);

              const percentage = (invoice / card.limit) * 100;
              const progress = Math.min(percentage / 100, 1);

              return (
                <TouchableOpacity
                  key={card.id}
                  style={{ marginBottom: spacing.md }}
                  onPress={() => navigation.navigate('AddCreditCard', { card: card })}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ ...typography.body, color: theme.colors.onSurface, fontWeight: '500' }}>
                      {card.name} {card.last4Digits ? `•••• ${card.last4Digits}` : ''}
                    </Text>
                    <Text style={{ ...typography.body, color: theme.colors.onSurface }}>
                      {formatValue(invoice)} <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>/ {formatValue(card.limit)}</Text>
                    </Text>
                  </View>
                  <ProgressBar
                    value={invoice}
                    max={card.limit}
                    color={theme.colors.primary}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>
                      {new Date().getDate() <= card.closingDay ? 'Fatura Aberta' : 'Fatura Próximo Mês'}
                    </Text>
                    <Text style={{ ...typography.caption, color: theme.colors.onSurfaceVariant }}>
                      Vence dia {card.dueDay}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
                      color: isPositive ? (theme.colors as any).success : theme.colors.error,
                      fontWeight: 'bold'
                    }}>
                      {isValuesVisible ? (
                        <>
                          {isPositive ? '+' : ''}R$ {diff.toFixed(2)} ({isPositive ? '+' : ''}{percentage.toFixed(1)}%)
                        </>
                      ) : 'R$ ••••••'}
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

          {
            netWorthHistory.length > 1 && !netWorthHistory.some(d => isNaN(d.value) || isNaN(d.date.getTime())) && (
              <NetWorthChart data={netWorthHistory} period={selectedPeriod} hideValues={!isValuesVisible} />
            )
          }
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
                  color={(theme.colors as any).success}
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
            <AnimatedBarChart data={categoryData} hideValues={!isValuesVisible} />
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
                  {formatValue(budget.spent)} / {formatValue(budget.limitAmount)}
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
      // alignItems: 'center', // Removed to allow stretch/top alignment
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start', // Ensure content starts at top
    },
    summaryDivider: {
      width: 1,
      // height: 40, // Removed fixed height to allow stretch
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
      fontWeight: 'bold', // Added bold
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
