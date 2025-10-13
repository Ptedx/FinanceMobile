import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconButton, FAB, useTheme } from 'react-native-paper';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { AlertBanner } from '../components/AlertBanner';
import { AnimatedBarChart } from '../components/AnimatedBarChart';
import { TransactionTypeSheet } from '../components/TransactionTypeSheet';
import { useFinanceStore } from '../store/financeStore';
import { useFinanceEngine } from '../hooks/useFinanceEngine';
import { spacing, typography } from '../theme';
import { getCategoryColor, getCategoryLabel } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DashboardScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { alerts, markAlertAsRead } = useFinanceStore();
  const { dashboardData, getSpendingInsights } = useFinanceEngine();
  const insights = getSpendingInsights();
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

  const unreadAlerts = alerts.filter(a => !a.isRead).slice(0, 3);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá!</Text>
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
            onDismiss={() => markAlertAsRead(alert.id)}
          />
        ))}

        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumo do mês</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Gasto</Text>
              <Text style={styles.summaryValue}>
                R$ {dashboardData.monthlyTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Projeção</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
                R$ {dashboardData.projection.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

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
    summaryLabel: {
      ...typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      ...typography.h2,
      color: theme.colors.primary,
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

