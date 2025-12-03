import { Expense, Budget, Goal, Alert, Income, CreditCard } from '../types';

export interface IDatabaseService {
  init(): Promise<void>;

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  getExpenses(startDate?: string, endDate?: string, creditCardId?: string): Promise<Expense[]>;
  updateExpense(id: string, expense: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income>;
  getIncomes(startDate?: string, endDate?: string): Promise<Income[]>;
  updateIncome(id: string, income: Partial<Income>): Promise<Income>;
  deleteIncome(id: string): Promise<void>;

  addBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget>;
  updateBudget(id: string, budget: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  getBudgets(month: string): Promise<Budget[]>;

  addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal>;
  getGoals(): Promise<Goal[]>;
  updateGoal(id: string, goal: Partial<Goal>): Promise<void>;
  deleteGoal(id: string): Promise<void>;

  addAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
  getAlerts(unreadOnly?: boolean): Promise<Alert[]>;
  markAlertAsRead(id: string): Promise<void>;
  clearOldAlerts(daysOld?: number): Promise<void>;

  getCreditCards(): Promise<CreditCard[]>;
  addCreditCard(card: Omit<CreditCard, 'id' | 'createdAt'>): Promise<CreditCard>;
  updateCreditCard(id: string, card: Partial<CreditCard>): Promise<CreditCard>;
  deleteCreditCard(id: string): Promise<void>;

  payInvoice(cardId: string, amount: number, date: string): Promise<any>;
  cancelInvoicePayment(paymentId: string): Promise<void>;
  getInvoicePayments(cardId: string): Promise<any[]>;
  generateIntegrationKey(): Promise<{ key: string, expiresAt: string }>;
}
