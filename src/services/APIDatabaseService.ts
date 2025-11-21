import { IDatabaseService } from './IDatabaseService';
import { Expense, Budget, Goal, Alert, Income } from '../types';
import { AuthService } from './AuthService';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3006' : 'http://localhost:3006';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await AuthService.getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export class APIDatabaseService implements IDatabaseService {
    async init(): Promise<void> {
        // No local init needed
    }

    async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
        return fetchWithAuth('/expenses', {
            method: 'POST',
            body: JSON.stringify(expense),
        });
    }

    async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
        const query = new URLSearchParams();
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
        return fetchWithAuth(`/expenses?${query.toString()}`);
    }

    async deleteExpense(id: string): Promise<void> {
        return fetchWithAuth(`/expenses/${id}`, { method: 'DELETE' });
    }

    async addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
        return fetchWithAuth('/incomes', {
            method: 'POST',
            body: JSON.stringify(income),
        });
    }

    async getIncomes(startDate?: string, endDate?: string): Promise<Income[]> {
        const query = new URLSearchParams();
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
        return fetchWithAuth(`/incomes?${query.toString()}`);
    }

    async deleteIncome(id: string): Promise<void> {
        return fetchWithAuth(`/incomes/${id}`, { method: 'DELETE' });
    }

    async setBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
        return fetchWithAuth('/budgets', {
            method: 'POST',
            body: JSON.stringify(budget),
        });
    }

    async getBudgets(month: string): Promise<Budget[]> {
        return fetchWithAuth(`/budgets?month=${month}`);
    }

    async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
        return fetchWithAuth('/goals', {
            method: 'POST',
            body: JSON.stringify(goal),
        });
    }

    async getGoals(): Promise<Goal[]> {
        return fetchWithAuth('/goals');
    }

    async updateGoal(id: string, currentAmount: number): Promise<void> {
        return fetchWithAuth(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ currentAmount }),
        });
    }

    async deleteGoal(id: string): Promise<void> {
        return fetchWithAuth(`/goals/${id}`, { method: 'DELETE' });
    }

    async addAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
        return fetchWithAuth('/alerts', {
            method: 'POST',
            body: JSON.stringify(alert),
        });
    }

    async getAlerts(unreadOnly?: boolean): Promise<Alert[]> {
        const query = unreadOnly ? '?unreadOnly=true' : '';
        return fetchWithAuth(`/alerts${query}`);
    }

    async markAlertAsRead(id: string): Promise<void> {
        return fetchWithAuth(`/alerts/${id}/read`, { method: 'PUT' });
    }

    async clearOldAlerts(daysOld?: number): Promise<void> {
        return fetchWithAuth('/alerts/old', {
            method: 'DELETE',
            body: JSON.stringify({ daysOld }),
        });
    }
}
