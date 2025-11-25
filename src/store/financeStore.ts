import { create } from 'zustand';
import { Expense, Budget, Goal, Alert, BudgetProgress, Income, CreditCard, InvoicePayment } from '../types';
import { db } from '../services/database';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

interface FinanceState {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  goals: Goal[];
  alerts: Alert[];
  invoicePayments: InvoicePayment[];

  payInvoice: (cardId: string, amount: number, date: string) => Promise<void>;
  cancelInvoicePayment: (paymentId: string) => Promise<void>;
  loadInvoicePayments: (cardId: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  expenses: [],
  incomes: [],
  budgets: [],
  goals: [],
  alerts: [],
  creditCards: [],
  invoicePayments: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  isValuesVisible: false,

  toggleValuesVisibility: () => {
    set(state => ({ isValuesVisible: !state.isValuesVisible }));
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await db.init();

      const currentMonth = format(new Date(), 'yyyy-MM');
      // Load from previous month to ensure we have data for open credit card invoices
      const startDate = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      await Promise.all([
        get().loadExpenses(startDate, endDate),
        get().loadIncomes(startDate, endDate),
        get().loadBudgets(currentMonth),
        get().loadGoals(),
        get().loadAlerts(true),
        get().fetchCreditCards(),
      ]);

      // Load invoice payments for all cards
      // This might be expensive if many cards, but usually few.
      // Alternatively, load on demand or just load all recent ones.
      // For now, let's load for all fetched cards.
      const cards = get().creditCards;
      const paymentsPromises = cards.map(c => db.getInvoicePayments(c.id));
      const paymentsArrays = await Promise.all(paymentsPromises);
      const allPayments = paymentsArrays.flat();

      set({ invoicePayments: allPayments, isInitialized: true });
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

    if (income.goalAllocations && income.goalAllocations.length > 0) {
      const { goals } = get();
      for (const alloc of income.goalAllocations) {
        const goal = goals.find(g => g.id === alloc.goalId);
        if (!goal) continue;
        if (goal.type !== 'save') continue;
        if (goal.currentAmount >= goal.targetAmount) continue;

        const nextAmount = Math.min(goal.targetAmount, (goal.currentAmount || 0) + (alloc.amount || 0));
        await db.updateGoal(goal.id, { currentAmount: nextAmount });
        set(state => ({
          goals: state.goals.map(g => g.id === goal.id ? { ...g, currentAmount: nextAmount } : g),
        }));
      }
    }
  },

  updateIncome: async (id, income) => {
    const { incomes, goals } = get();
    const oldIncome = incomes.find(i => i.id === id);

    if (oldIncome && (oldIncome.goalAllocations || income.goalAllocations)) {
      const oldAllocations = oldIncome.goalAllocations || [];
      const newAllocations = income.goalAllocations || [];

      for (const alloc of oldAllocations) {
        const goal = goals.find(g => g.id === alloc.goalId);
        if (goal) {
          const newAmount = Math.max(0, goal.currentAmount - alloc.amount);
          await db.updateGoal(goal.id, { currentAmount: newAmount });
          set(state => ({
            goals: state.goals.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount } : g)
          }));
        }
      }

      const currentGoals = get().goals;
      for (const alloc of newAllocations) {
        const goal = currentGoals.find(g => g.id === alloc.goalId);
        if (goal) {
          const newAmount = Math.min(goal.targetAmount, goal.currentAmount + alloc.amount);
          await db.updateGoal(goal.id, { currentAmount: newAmount });
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

  updateGoal: async (id, goal) => {
    await db.updateGoal(id, goal);
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...goal } : g),
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

  fetchCreditCards: async () => {
    try {
      const creditCards = await db.getCreditCards();
      set({ creditCards });
    } catch (error) {
      console.error('Failed to fetch credit cards', error);
    }
  },

  addCreditCard: async (card) => {
    try {
      set({ isLoading: true, error: null });
      const newCard = await db.addCreditCard(card);
      set(state => ({
        creditCards: [...state.creditCards, newCard],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateCreditCard: async (id, card) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCard = await db.updateCreditCard(id, card);
      set(state => ({
        creditCards: state.creditCards.map(c => c.id === id ? updatedCard : c),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCreditCard: async (id) => {
    try {
      await db.deleteCreditCard(id);
      set((state) => ({
        creditCards: state.creditCards.filter((c) => c.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete credit card' });
    }
  },

  payInvoice: async (cardId, amount, date) => {
    const payment = await db.payInvoice(cardId, amount, date);
    set(state => ({ invoicePayments: [payment, ...state.invoicePayments] }));
  },

  cancelInvoicePayment: async (paymentId) => {
    await db.cancelInvoicePayment(paymentId);
    set(state => ({ invoicePayments: state.invoicePayments.filter(p => p.id !== paymentId) }));
  },

  loadInvoicePayments: async (cardId) => {
    const payments = await db.getInvoicePayments(cardId);
    set(state => {
      // Merge with existing payments, avoiding duplicates
      const existingIds = new Set(state.invoicePayments.map(p => p.id));
      const newPayments = payments.filter(p => !existingIds.has(p.id));
      return { invoicePayments: [...state.invoicePayments, ...newPayments] };
    });
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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.value, 0);
  },

  getMonthlyIncome: () => {
    const { incomes } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return incomes
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.value, 0);
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
      creditCards: [],
      invoicePayments: [],
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  },
}));
