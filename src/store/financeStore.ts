import { create } from 'zustand';
import { Expense, Budget, Goal, Alert, BudgetProgress, Income } from '../types';
import { db } from '../services/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface FinanceState {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  goals: Goal[];
  alerts: Alert[];
  isLoading: boolean;

  initialize: () => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  loadExpenses: (startDate?: string, endDate?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  loadIncomes: (startDate?: string, endDate?: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  setBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  loadBudgets: (month: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  loadGoals: () => Promise<void>;
  updateGoal: (id: string, currentAmount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => Promise<void>;
  loadAlerts: (unreadOnly?: boolean) => Promise<void>;
  markAlertAsRead: (id: string) => Promise<void>;

  getBudgetProgress: () => BudgetProgress[];
  getMonthlyTotal: () => number;
  getMonthlyIncome: () => number;
  checkBudgetAlerts: () => void;
  reset: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  expenses: [],
  incomes: [],
  budgets: [],
  goals: [],
  alerts: [],
  isLoading: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      await db.init();

      const currentMonth = format(new Date(), 'yyyy-MM');
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      await Promise.all([
        get().loadExpenses(startDate, endDate),
        get().loadIncomes(startDate, endDate),
        get().loadBudgets(currentMonth),
        get().loadGoals(),
        get().loadAlerts(true),
      ]);
    } catch (error) {
      console.error('Error initializing finance store:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addExpense: async (expense) => {
    const newExpense = await db.addExpense(expense);
    set(state => ({ expenses: [newExpense, ...state.expenses] }));

    get().checkBudgetAlerts();
  },

  loadExpenses: async (startDate, endDate) => {
    const expenses = await db.getExpenses(startDate, endDate);
    set({ expenses });
  },

  deleteExpense: async (id) => {
    await db.deleteExpense(id);
    set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
  },

  addIncome: async (income) => {
    const newIncome = await db.addIncome(income);
    set(state => ({ incomes: [newIncome, ...state.incomes] }));

    // Apply goal allocations, if provided, only to selected active goals
    if (income.goalAllocations && income.goalAllocations.length > 0) {
      const { goals } = get();
      for (const alloc of income.goalAllocations) {
        const goal = goals.find(g => g.id === alloc.goalId);
        if (!goal) continue;
        if (goal.type !== 'save') continue;
        if (goal.currentAmount >= goal.targetAmount) continue; // skip completed

        const nextAmount = Math.min(goal.targetAmount, (goal.currentAmount || 0) + (alloc.amount || 0));
        await db.updateGoal(goal.id, nextAmount);
        set(state => ({
          goals: state.goals.map(g => g.id === goal.id ? { ...g, currentAmount: nextAmount } : g),
        }));
      }
    }
  },

  loadIncomes: async (startDate, endDate) => {
    const incomes = await db.getIncomes(startDate, endDate);
    set({ incomes });
  },

  deleteIncome: async (id) => {
    await db.deleteIncome(id);
    set(state => ({ incomes: state.incomes.filter(i => i.id !== id) }));
  },

  setBudget: async (budget) => {
    const newBudget = await db.setBudget(budget);
    set(state => {
      const filtered = state.budgets.filter(b => b.category !== budget.category);
      return { budgets: [...filtered, newBudget] };
    });
  },

  loadBudgets: async (month) => {
    const budgets = await db.getBudgets(month);
    set({ budgets });
  },

  addGoal: async (goal) => {
    const newGoal = await db.addGoal(goal);
    set(state => ({ goals: [...state.goals, newGoal] }));
  },

  loadGoals: async () => {
    const goals = await db.getGoals();
    set({ goals });
  },

  updateGoal: async (id, currentAmount) => {
    await db.updateGoal(id, currentAmount);
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, currentAmount } : g),
    }));
  },

  deleteGoal: async (id) => {
    await db.deleteGoal(id);
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
  },

  addAlert: async (alert) => {
    const newAlert = await db.addAlert(alert);
    set(state => ({ alerts: [newAlert, ...state.alerts] }));
  },

  loadAlerts: async (unreadOnly = false) => {
    const alerts = await db.getAlerts(unreadOnly);
    set({ alerts });
  },

  markAlertAsRead: async (id) => {
    await db.markAlertAsRead(id);
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, isRead: true } : a),
    }));
  },

  getBudgetProgress: () => {
    const { expenses, budgets } = get();

    return budgets.map(budget => {
      const spent = expenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.value, 0);

      const percentage = (spent / budget.limitAmount) * 100;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        category: budget.category,
        limitAmount: budget.limitAmount,
        spent,
        percentage: Math.min(percentage, 100),
        status,
      };
    });
  },

  getMonthlyTotal: () => {
    const { expenses } = get();
    return expenses.reduce((sum, e) => sum + e.value, 0);
  },

  getMonthlyIncome: () => {
    const { incomes } = get();
    return incomes.reduce((sum, i) => sum + i.value, 0);
  },

  checkBudgetAlerts: () => {
    const budgetProgress = get().getBudgetProgress();

    budgetProgress.forEach(async (progress) => {
      if (progress.status === 'warning') {
        await get().addAlert({
          type: 'budget_warning',
          message: `Você já gastou ${progress.percentage.toFixed(0)}% do seu orçamento de ${progress.category}`,
          category: progress.category,
          isRead: false,
        });
      } else if (progress.status === 'exceeded') {
        await get().addAlert({
          type: 'budget_exceeded',
          message: `Orçamento de ${progress.category} ultrapassado! Você gastou R$ ${(progress.spent - progress.limitAmount).toFixed(2)} a mais.`,
          category: progress.category,
          isRead: false,
        });
      }
    });
  },

  reset: () => {
    set({
      expenses: [],
      incomes: [],
      budgets: [],
      goals: [],
      alerts: [],
      isLoading: false,
    });
  },
}));
