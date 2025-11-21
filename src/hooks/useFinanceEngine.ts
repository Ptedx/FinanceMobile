import { useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns';
import { DashboardData, Goal } from '../types';

export const useFinanceEngine = () => {
  const { expenses, incomes, budgets, goals, getBudgetProgress, getMonthlyTotal, getMonthlyIncome } = useFinanceStore();

  const dashboardData: DashboardData = useMemo(() => {
    const monthlyTotal = getMonthlyTotal();
    const monthlyIncome = getMonthlyIncome();
    const budgetProgress = getBudgetProgress();

    const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const availableBalance = monthlyIncome - monthlyTotal;

    // For now, projection equals available balance since we don't have future recurring items logic yet.
    const projection = availableBalance;

    const totalGoalProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount * 100), 0) / goals.length
      : 0;

    return {
      monthlyTotal,
      monthlyIncome,
      budgetProgress,
      goalProgress: totalGoalProgress,
      projection,
      availableBalance,
    };
  }, [expenses, incomes, budgets, goals]);

  const calculateGoalETA = (goal: Goal): string => {
    if (goal.type === 'spend_limit') {
      return 'N/A';
    }

    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 'Concluída!';

    const monthlyIncome = getMonthlyIncome();
    const monthlyExpenses = getMonthlyTotal();
    const avgMonthlySavings = monthlyIncome - monthlyExpenses;

    if (avgMonthlySavings <= 0) {
      return 'Impossível (gastos > receitas)';
    }

    const monthsNeeded = Math.ceil(remaining / avgMonthlySavings);

    return `~${monthsNeeded} ${monthsNeeded === 1 ? 'mês' : 'meses'}`;
  };

  const getSpendingInsights = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.value;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    const recurringExpenses = expenses.filter(e => e.isRecurring);
    const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.value, 0);

    return {
      topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
      recurringTotal,
      categoryBreakdown: categoryTotals,
    };
  };

  const getComparisonWithLastMonth = () => {
    const lastMonthStart = startOfMonth(addMonths(new Date(), -1));
    const lastMonthEnd = endOfMonth(addMonths(new Date(), -1));

    return {
      percentageChange: 0,
      difference: 0,
    };
  };

  const getNetWorthHistory = (period: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '6M') => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '1M': startDate = startOfMonth(addMonths(now, -1)); break; // Actually let's do rolling window? Or start of month? User asked for "1M". Usually means last 30 days. But "Timeline" usually implies context. Let's use strict date subtraction.
      case '3M': startDate = addMonths(now, -3); break;
      case '6M': startDate = addMonths(now, -6); break;
      case '1Y': startDate = addMonths(now, -12); break;
      case 'ALL': startDate = null; break;
    }

    // Override 1M to be simpler: Last 30 days
    if (period === '1M') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    const allTransactions = [
      ...expenses.map(e => ({ date: new Date(e.date), value: -e.value })),
      ...incomes.map(i => ({ date: new Date(i.date), value: i.value }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentBalance = 0;

    // Calculate starting balance
    if (startDate) {
      const previousTransactions = allTransactions.filter(t => t.date < startDate!);
      currentBalance = previousTransactions.reduce((sum, t) => sum + t.value, 0);
    }

    const periodTransactions = startDate
      ? allTransactions.filter(t => t.date >= startDate!)
      : allTransactions;

    const history: { date: Date; value: number }[] = [];

    // Add initial point
    if (startDate) {
      history.push({ date: startDate, value: currentBalance });
    } else if (periodTransactions.length > 0) {
      // For ALL, start with 0 or first transaction? 
      // If we start with 0 at first transaction date, it looks weird if the first transaction is large.
      // Let's just start processing.
    }

    if (period === '1M') {
      // Daily granularity - keep every transaction for detail
      periodTransactions.forEach(t => {
        currentBalance += t.value;
        history.push({ date: t.date, value: currentBalance });
      });
    } else {
      // Monthly granularity - group by month
      const groupedByMonth = new Map<string, number>();

      periodTransactions.forEach(t => {
        currentBalance += t.value;
        const monthKey = format(t.date, 'yyyy-MM');
        groupedByMonth.set(monthKey, currentBalance);
      });

      groupedByMonth.forEach((value, key) => {
        // Use the 15th of the month to center the point or end of month? 
        // Let's use the 1st for simplicity in parsing, but visually it represents the month end state.
        history.push({
          date: new Date(key + '-01'),
          value
        });
      });
    }

    // Add final point (today) to ensure chart goes to the end
    history.push({ date: now, value: currentBalance });

    // If no data, return flat line
    if (history.length === 0) {
      return [{ date: startDate || new Date(now.getFullYear(), 0, 1), value: 0 }, { date: now, value: 0 }];
    }

    return history.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    dashboardData,
    calculateGoalETA,
    getSpendingInsights,
    getComparisonWithLastMonth,
    getNetWorthHistory,
  };
};
