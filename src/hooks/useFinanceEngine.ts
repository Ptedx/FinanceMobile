import { useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { startOfMonth, endOfMonth, addMonths, differenceInDays, format, subMonths } from 'date-fns';
import { DashboardData, Goal } from '../types';

export const useFinanceEngine = () => {
  const { expenses, incomes, budgets, goals, invoicePayments, getBudgetProgress, getMonthlyTotal, getMonthlyIncome, financialSummary } = useFinanceStore();

  const dashboardData: DashboardData = useMemo(() => {
    // Keep these as "Current Month" stats for the specific UI displays
    const monthlyTotal = getMonthlyTotal();
    const monthlyIncome = getMonthlyIncome();
    const budgetProgress = getBudgetProgress();

    // Use fetched summary for accurate All-Time balance
    const availableBalance = financialSummary?.availableBalance ?? 0;
    const netWorth = financialSummary?.netWorth ?? 0;

    // Only for "Monthly Flow" UI (Invoice payments made THIS month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyInvoicePayments = invoicePayments
        .filter(p => {
            const d = new Date(p.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

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
  }, [expenses, incomes, budgets, goals, invoicePayments, financialSummary]);

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

    // We need to simulate the "Cash" balance and "Debt" balance separately over time.
    // Events that affect Cash: Income (+), Debit Expense (-), Invoice Payment (-)
    // Events that affect Debt: Credit Expense (+), Invoice Payment (-)

    // 1. Gather all events
    const events: { date: Date; type: 'income' | 'debit_expense' | 'credit_expense' | 'invoice_payment'; value: number }[] = [];

    incomes.forEach(i => events.push({ date: new Date(i.date), type: 'income', value: i.value }));
    expenses.forEach(e => {
      if (e.creditCardId) {
        events.push({ date: new Date(e.date), type: 'credit_expense', value: e.value });
      } else {
        events.push({ date: new Date(e.date), type: 'debit_expense', value: e.value });
      }
    });
    invoicePayments.forEach(p => events.push({ date: new Date(p.date), type: 'invoice_payment', value: p.amount }));

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 2. Simulate
    let currentCash = 0;
    let currentDebt = 0;
    const historyPoints: { date: Date; cash: number; debt: number; netWorth: number }[] = [];

    events.forEach(event => {
      switch (event.type) {
        case 'income':
          currentCash += event.value;
          break;
        case 'debit_expense':
          currentCash -= event.value;
          break;
        case 'invoice_payment':
          currentCash -= event.value;
          currentDebt -= event.value; // Reduces debt
          break;
        case 'credit_expense':
          currentDebt += event.value;
          break;
      }

      // We do NOT clamp currentCash to 0 here anymore, because we want the history 
      // to reflect the true Net Worth (which includes deficits).
      // However, we still clamp Debt to 0 just in case.
      if (currentDebt < 0) currentDebt = 0;

      historyPoints.push({
        date: event.date,
        cash: currentCash,
        debt: currentDebt,
        netWorth: currentCash - currentDebt
      });
    });

    // 3. Filter and Format for Chart
    // If no events, return flat line
    if (historyPoints.length === 0) {
      return [{ date: startDate || new Date(now.getFullYear(), 0, 1), value: 0 }, { date: now, value: 0 }];
    }

    let filteredPoints = startDate
      ? historyPoints.filter(p => p.date >= startDate!)
      : historyPoints;

    // If filtered is empty but we have history (e.g. all events before startDate),
    // we should start with the state at startDate.
    if (filteredPoints.length === 0 && historyPoints.length > 0) {
      // Find the last state before startDate
      const lastState = historyPoints[historyPoints.length - 1];
      // Actually we want the state at the exact moment of startDate.
      // Since we simulated everything, the last point is the current state.
      // But we need to find the point just before startDate.
      const stateAtStart = historyPoints.filter(p => p.date < startDate!).pop() || { cash: 0, debt: 0, netWorth: 0, date: startDate! };

      filteredPoints.push({ ...stateAtStart, date: startDate! });
    } else if (startDate && filteredPoints.length > 0 && filteredPoints[0].date > startDate) {
      // Prepend the state at startDate if the first event in range is after startDate
      const stateAtStart = historyPoints.filter(p => p.date < startDate!).pop() || { cash: 0, debt: 0, netWorth: 0, date: startDate! };
      filteredPoints.unshift({ ...stateAtStart, date: startDate });
    }

    const finalHistory: { date: Date; value: number }[] = [];

    // Use high granularity if the period is short OR if we have few data points
    if (period === '1D' || period === '7D' || period === '1M' || filteredPoints.length < 50) {
      filteredPoints.forEach(p => {
        finalHistory.push({ date: p.date, value: p.netWorth });
      });
    } else {
      // Monthly granularity - group by month (taking the last value of the month)
      const groupedByMonth = new Map<string, number>();

      filteredPoints.forEach(p => {
        const monthKey = format(p.date, 'yyyy-MM');
        groupedByMonth.set(monthKey, p.netWorth);
      });

      groupedByMonth.forEach((value, key) => {
        finalHistory.push({
          date: new Date(key + '-01'),
          value
        });
      });
    }

    // Add final point (today)
    finalHistory.push({ date: now, value: currentCash - currentDebt });

    return finalHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    dashboardData,
    calculateGoalETA,
    getSpendingInsights,
    getComparisonWithLastMonth,
    getNetWorthHistory,
  };
};
