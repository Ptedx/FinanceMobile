import { useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';
import { DashboardData, Goal } from '../types';

export const useFinanceEngine = () => {
  const { expenses, incomes, budgets, goals, getBudgetProgress, getMonthlyTotal, getMonthlyIncome } = useFinanceStore();

  const dashboardData: DashboardData = useMemo(() => {
    const monthlyTotal = getMonthlyTotal();
    const monthlyIncome = getMonthlyIncome();
    const budgetProgress = getBudgetProgress();
    
    const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const availableBalance = monthlyIncome - monthlyTotal;
    
    const avgDailySpending = expenses.length > 0 
      ? monthlyTotal / new Date().getDate() 
      : 0;
    
    const daysLeftInMonth = differenceInDays(
      endOfMonth(new Date()),
      new Date()
    );
    
    const projection = monthlyTotal + (avgDailySpending * daysLeftInMonth);
    
    const totalGoalProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount * 100), 0) / goals.length
      : 0;

    return {
      monthlyTotal,
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

  return {
    dashboardData,
    calculateGoalETA,
    getSpendingInsights,
    getComparisonWithLastMonth,
  };
};
