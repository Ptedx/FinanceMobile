import { useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns';
import { DashboardData, Goal } from '../types';

export const useFinanceEngine = () => {
  const { expenses, incomes, budgets, goals, invoicePayments, getBudgetProgress, getMonthlyTotal, getMonthlyIncome } = useFinanceStore();

  const dashboardData: DashboardData = useMemo(() => {
    const monthlyTotal = getMonthlyTotal();
    const monthlyIncome = getMonthlyIncome();
    const budgetProgress = getBudgetProgress();

    const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);

    const debitExpenses = expenses.filter(e => !e.creditCardId).reduce((sum, e) => sum + e.value, 0);
    const creditExpenses = expenses.filter(e => !!e.creditCardId).reduce((sum, e) => sum + e.value, 0);

    // Calculate total invoice payments made in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyInvoicePayments = invoicePayments
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = monthlyIncome - debitExpenses - monthlyInvoicePayments;

    // Net Worth = Assets (Cash) - Liabilities (Debt)
    // Assets = availableBalance
    // Liabilities = creditExpenses (Total Spent) - monthlyInvoicePayments (Amount Paid Back)
    // We use Math.max(0, ...) to ensure that if we pay more than the *visible/loaded* expenses (e.g. paying a future bill or one from 3 months ago),
    // we don't artificially inflate the Net Worth by treating the 'excess' payment as a negative liability.
    // In that case, the Net Worth correctly drops because availableBalance drops, and the 'Liability' stays at 0 (or low).
    const netWorth = availableBalance - Math.max(0, creditExpenses - monthlyInvoicePayments);

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
      netWorth,
      monthlyInvoicePayments,
    };
  }, [expenses, incomes, budgets, goals, invoicePayments]);

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

  const getNetWorthHistory = (period: '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL' = '6M') => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '1D': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7D': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '1M': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); break;
      case '3M': startDate = addMonths(now, -3); break;
      case '6M': startDate = addMonths(now, -6); break;
      case '1Y': startDate = addMonths(now, -12); break;
      case 'ALL': startDate = null; break;
    }

    const allTransactions = [
      ...expenses.map(e => ({ date: new Date(e.date), value: -e.value })),
      ...incomes.map(i => ({ date: new Date(i.date), value: i.value }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // If the calculated start date is before the first transaction, 
    // we should start from the first transaction instead of showing empty space.
    let isClamped = false;
    if (allTransactions.length > 0 && startDate) {
      const firstTransactionDate = allTransactions[0].date;
      if (startDate < firstTransactionDate) {
        startDate = null;
        isClamped = true;
      }
    }

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
    } else if (isClamped && periodTransactions.length > 0) {
      // If we clamped the start date (showing full history), add a point just before 
      // the first transaction to represent the starting state (e.g., 0).
      // This ensures the "Growth" calculation considers the starting balance.
      history.push({ date: new Date(periodTransactions[0].date.getTime() - 60000), value: currentBalance });
    }

    // Use high granularity if the period is short OR if we have few data points
    // This prevents "flat lines" when viewing long periods with sparse data
    if (period === '1D' || period === '7D' || period === '1M' || periodTransactions.length < 50) {
      // High granularity - keep every transaction
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
        history.push({
          date: new Date(key + '-01'),
          value
        });
      });
    }

    // Add final point (today)
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
