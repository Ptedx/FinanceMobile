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
  error: string | null;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  retry: () => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  loadExpenses: (startDate?: string, endDate?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  loadIncomes: (startDate?: string, endDate?: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
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
  error: null,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true, error: null });
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
      set({ isInitialized: true });
    } catch (error) {
      console.error('Error initializing finance store:', error);
      set({ error: 'Falha ao carregar dados. Verifique sua conexão.' });
    } finally {
      set({ isLoading: false });
    }
  },

  retry: async () => {
    await get().initialize();
  },

  addExpense: async (expense) => {
    const newExpense = await db.addExpense(expense);
    set(state => ({ expenses: [newExpense, ...state.expenses] }));

    get().checkBudgetAlerts();
  },

  updateExpense: async (id, expense) => {
    const updatedExpense = await db.updateExpense(id, expense);
    set(state => ({
      expenses: state.expenses.map(e => e.id === id ? updatedExpense : e)
    }));
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

  updateIncome: async (id, income) => {
    const { incomes, goals } = get();
    const oldIncome = incomes.find(i => i.id === id);

    // Handle goal allocations update
    if (oldIncome && (oldIncome.goalAllocations || income.goalAllocations)) {
      const oldAllocations = oldIncome.goalAllocations || [];
      const newAllocations = income.goalAllocations || [];

      // 1. Revert old allocations
      for (const alloc of oldAllocations) {
        const goal = goals.find(g => g.id === alloc.goalId);
        if (goal) {
          const newAmount = Math.max(0, goal.currentAmount - alloc.amount);
          await db.updateGoal(goal.id, newAmount);
          // Update local state immediately to reflect changes for next steps
          set(state => ({
            goals: state.goals.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount } : g)
          }));
        }
      }

      // 2. Apply new allocations
      // Refresh goals from state as they might have been updated above
      const currentGoals = get().goals;
      for (const alloc of newAllocations) {
        const goal = currentGoals.find(g => g.id === alloc.goalId);
        if (goal) {
          const newAmount = Math.min(goal.targetAmount, goal.currentAmount + alloc.amount);
          await db.updateGoal(goal.id, newAmount);
          set(state => ({
            goals: state.goals.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount } : g)
          }));
        }
      }
    }

    const updatedIncome = await db.updateIncome(id, income);
    set(state => ({
      incomes: state.incomes.map(i => i.id === id ? updatedIncome : i)
    }));
  },

  loadIncomes: async (startDate, endDate) => {
    const incomes = await db.getIncomes(startDate, endDate);
    set({ incomes });
  },

  deleteIncome: async (id) => {
    await db.deleteIncome(id);
    set(state => ({ incomes: state.incomes.filter(i => i.id !== id) }));
  },

  addBudget: async (budget) => {
    const newBudget = await db.addBudget(budget);
    set(state => {
      // Remove existing budget for same category if any (though backend handles this, frontend state should reflect)
      const filtered = state.budgets.filter(b => b.category !== budget.category);
      return { budgets: [...filtered, newBudget] };
    });
    get().checkBudgetAlerts();
  },

  updateBudget: async (id, budget) => {
    const updatedBudget = await db.updateBudget(id, budget);
    set(state => ({
      budgets: state.budgets.map(b => b.id === id ? updatedBudget : b)
    }));
    get().checkBudgetAlerts();
  },

  deleteBudget: async (id) => {
    await db.deleteBudget(id);
    set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
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
      error: null,
      isInitialized: false,
    });
  },
}));
