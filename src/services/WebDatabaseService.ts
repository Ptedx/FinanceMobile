import localforage from 'localforage';
import { Expense, Budget, Goal, Alert, Income } from '../types';
import { IDatabaseService } from './IDatabaseService';

class WebDatabaseService implements IDatabaseService {
  private stores = {
    expenses: localforage.createInstance({ name: 'finance_app', storeName: 'expenses' }),
    incomes: localforage.createInstance({ name: 'finance_app', storeName: 'incomes' }),
    budgets: localforage.createInstance({ name: 'finance_app', storeName: 'budgets' }),
    goals: localforage.createInstance({ name: 'finance_app', storeName: 'goals' }),
    alerts: localforage.createInstance({ name: 'finance_app', storeName: 'alerts' }),
  };

  async init() {
    try {
      console.log('Web database initialized successfully');
    } catch (error) {
      console.error('Error initializing web database:', error);
      throw error;
    }
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newExpense: Expense = { ...expense, id, createdAt };
    
    await this.stores.expenses.setItem(id, newExpense);
    return newExpense;
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    const expenses: Expense[] = [];
    
    await this.stores.expenses.iterate<Expense, void>((value) => {
      if (startDate && endDate) {
        if (value.date >= startDate && value.date <= endDate) {
          expenses.push(value);
        }
      } else {
        expenses.push(value);
      }
    });
    
    return expenses.sort((a, b) => b.date.localeCompare(a.date));
  }

  async deleteExpense(id: string): Promise<void> {
    await this.stores.expenses.removeItem(id);
  }

  async addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newIncome: Income = { ...income, id, createdAt };
    
    await this.stores.incomes.setItem(id, newIncome);
    return newIncome;
  }

  async getIncomes(startDate?: string, endDate?: string): Promise<Income[]> {
    const incomes: Income[] = [];
    
    await this.stores.incomes.iterate<Income, void>((value) => {
      if (startDate && endDate) {
        if (value.date >= startDate && value.date <= endDate) {
          incomes.push(value);
        }
      } else {
        incomes.push(value);
      }
    });
    
    return incomes.sort((a, b) => b.date.localeCompare(a.date));
  }

  async deleteIncome(id: string): Promise<void> {
    await this.stores.incomes.removeItem(id);
  }

  async setBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const id = `bud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newBudget: Budget = { ...budget, id, createdAt };
    
    const key = `${budget.category}_${budget.month}`;
    await this.stores.budgets.setItem(key, newBudget);
    return newBudget;
  }

  async getBudgets(month: string): Promise<Budget[]> {
    const budgets: Budget[] = [];
    
    await this.stores.budgets.iterate<Budget, void>((value) => {
      if (value.month === month) {
        budgets.push(value);
      }
    });
    
    return budgets;
  }

  async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newGoal: Goal = { ...goal, id, createdAt };
    
    await this.stores.goals.setItem(id, newGoal);
    return newGoal;
  }

  async getGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    await this.stores.goals.iterate<Goal, void>((value) => {
      goals.push(value);
    });
    
    return goals.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  }

  async updateGoal(id: string, currentAmount: number): Promise<void> {
    const goal = await this.stores.goals.getItem<Goal>(id);
    if (goal) {
      goal.currentAmount = currentAmount;
      await this.stores.goals.setItem(id, goal);
    }
  }

  async deleteGoal(id: string): Promise<void> {
    await this.stores.goals.removeItem(id);
  }

  async addAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const newAlert: Alert = { ...alert, id, createdAt };
    
    await this.stores.alerts.setItem(id, newAlert);
    return newAlert;
  }

  async getAlerts(unreadOnly: boolean = false): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    await this.stores.alerts.iterate<Alert, void>((value) => {
      if (!unreadOnly || !value.isRead) {
        alerts.push(value);
      }
    });
    
    return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markAlertAsRead(id: string): Promise<void> {
    const alert = await this.stores.alerts.getItem<Alert>(id);
    if (alert) {
      alert.isRead = true;
      await this.stores.alerts.setItem(id, alert);
    }
  }

  async clearOldAlerts(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();
    
    const toDelete: string[] = [];
    
    await this.stores.alerts.iterate<Alert, void>((value, key) => {
      if (value.createdAt < cutoffISO && value.isRead) {
        toDelete.push(key);
      }
    });
    
    for (const key of toDelete) {
      await this.stores.alerts.removeItem(key);
    }
  }
}

export default WebDatabaseService;
