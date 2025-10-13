import { Expense, Budget, Goal, Alert, Income } from '../types';

export interface IDatabaseService {
  init(): Promise<void>;
  
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  getExpenses(startDate?: string, endDate?: string): Promise<Expense[]>;
  deleteExpense(id: string): Promise<void>;
  
  addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income>;
  getIncomes(startDate?: string, endDate?: string): Promise<Income[]>;
  deleteIncome(id: string): Promise<void>;
  
  setBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget>;
  getBudgets(month: string): Promise<Budget[]>;
  
  addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal>;
  getGoals(): Promise<Goal[]>;
  updateGoal(id: string, currentAmount: number): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  
  addAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
  getAlerts(unreadOnly?: boolean): Promise<Alert[]>;
  markAlertAsRead(id: string): Promise<void>;
  clearOldAlerts(daysOld?: number): Promise<void>;
}
