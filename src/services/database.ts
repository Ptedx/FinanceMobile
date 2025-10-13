import * as SQLite from 'expo-sqlite';
import { Expense, Budget, Goal, Alert, Income } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('finance_app.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        isRecurring INTEGER NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS incomes (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        isRecurring INTEGER NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL UNIQUE,
        limitAmount REAL NOT NULL,
        month TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL,
        targetDate TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT,
        isRead INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    `);
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const newExpense: Expense = { ...expense, id, createdAt };

    await this.db.runAsync(
      'INSERT INTO expenses (id, category, value, date, paymentMethod, isRecurring, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, expense.category, expense.value, expense.date, expense.paymentMethod, expense.isRecurring ? 1 : 0, expense.description || null, createdAt]
    );

    return newExpense;
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM expenses';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';

    const result = await this.db.getAllAsync<any>(query, params);
    
    return result.map(row => ({
      ...row,
      isRecurring: row.isRecurring === 1,
    }));
  }

  async deleteExpense(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  }

  async addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const newIncome: Income = { ...income, id, createdAt };

    await this.db.runAsync(
      'INSERT INTO incomes (id, category, value, date, isRecurring, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, income.category, income.value, income.date, income.isRecurring ? 1 : 0, income.description || null, createdAt]
    );

    return newIncome;
  }

  async getIncomes(startDate?: string, endDate?: string): Promise<Income[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM incomes';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';

    const result = await this.db.getAllAsync<any>(query, params);
    
    return result.map(row => ({
      ...row,
      isRecurring: row.isRecurring === 1,
    }));
  }

  async deleteIncome(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM incomes WHERE id = ?', [id]);
  }

  async setBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `bud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const newBudget: Budget = { ...budget, id, createdAt };

    await this.db.runAsync(
      'INSERT OR REPLACE INTO budgets (id, category, limitAmount, month, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, budget.category, budget.limitAmount, budget.month, createdAt]
    );

    return newBudget;
  }

  async getBudgets(month: string): Promise<Budget[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<Budget>(
      'SELECT * FROM budgets WHERE month = ?',
      [month]
    );

    return result;
  }

  async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const newGoal: Goal = { ...goal, id, createdAt };

    await this.db.runAsync(
      'INSERT INTO goals (id, title, targetAmount, currentAmount, targetDate, type, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, goal.title, goal.targetAmount, goal.currentAmount, goal.targetDate, goal.type, goal.category || null, createdAt]
    );

    return newGoal;
  }

  async getGoals(): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY targetDate ASC');
  }

  async updateGoal(id: string, currentAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE goals SET currentAmount = ? WHERE id = ?', [currentAmount, id]);
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  }

  async addAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const newAlert: Alert = { ...alert, id, createdAt };

    await this.db.runAsync(
      'INSERT INTO alerts (id, type, message, category, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, alert.type, alert.message, alert.category || null, alert.isRead ? 1 : 0, createdAt]
    );

    return newAlert;
  }

  async getAlerts(unreadOnly: boolean = false): Promise<Alert[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM alerts';
    if (unreadOnly) {
      query += ' WHERE isRead = 0';
    }
    query += ' ORDER BY createdAt DESC';

    const result = await this.db.getAllAsync<any>(query);
    
    return result.map(row => ({
      ...row,
      isRead: row.isRead === 1,
    }));
  }

  async markAlertAsRead(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE alerts SET isRead = 1 WHERE id = ?', [id]);
  }

  async clearOldAlerts(daysOld: number = 30): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await this.db.runAsync('DELETE FROM alerts WHERE createdAt < ? AND isRead = 1', [cutoffDate.toISOString()]);
  }
}

export const db = new DatabaseService();
