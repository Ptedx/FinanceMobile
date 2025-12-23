import { IDatabaseService } from './IDatabaseService';
import { Expense, Budget, Goal, Alert, Income, CreditCard } from '../types';
import { AuthService } from './AuthService';
import { Platform } from 'react-native';

import { API_URL } from '../config/api';

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

    async getExpenses(startDate?: string, endDate?: string, creditCardId?: string): Promise<Expense[]> {
        const query = new URLSearchParams();
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
        if (creditCardId) query.append('creditCardId', creditCardId);
        return fetchWithAuth(`/expenses?${query.toString()}`);
    }

    async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
        return fetchWithAuth(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expense),
        });
    }

    async deleteExpense(id: string): Promise<void> {
        return fetchWithAuth(`/expenses/${id}`, { method: 'DELETE' });
    }

    private mapIncome(income: any): Income {
        return {
            ...income,
            goalAllocations: income.allocations?.map((a: any) => ({
                goalId: a.goalId,
                amount: a.amount
            }))
        };
    }

    async addIncome(income: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
        const response = await fetchWithAuth('/incomes', {
            method: 'POST',
            body: JSON.stringify(income),
        });
        return this.mapIncome(response);
    }

    async getIncomes(startDate?: string, endDate?: string): Promise<Income[]> {
        const query = new URLSearchParams();
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
        const response = await fetchWithAuth(`/incomes?${query.toString()}`);
        return response.map((i: any) => this.mapIncome(i));
    }

    async updateIncome(id: string, income: Partial<Income>): Promise<Income> {
        const response = await fetchWithAuth(`/incomes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(income),
        });
        return this.mapIncome(response);
    }

    async deleteIncome(id: string): Promise<void> {
        return fetchWithAuth(`/incomes/${id}`, { method: 'DELETE' });
    }

    async addBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
        return fetchWithAuth('/budgets', {
            method: 'POST',
            body: JSON.stringify(budget),
        });
    }

    async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
        return fetchWithAuth(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(budget),
        });
    }

    async deleteBudget(id: string): Promise<void> {
        return fetchWithAuth(`/budgets/${id}`, { method: 'DELETE' });
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

    async updateGoal(id: string, goal: Partial<Goal>): Promise<void> {
        return fetchWithAuth(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(goal),
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

    async getCreditCards(): Promise<CreditCard[]> {
        return fetchWithAuth('/credit-cards');
    }

    async addCreditCard(card: Omit<CreditCard, 'id' | 'createdAt'>): Promise<CreditCard> {
        return fetchWithAuth('/credit-cards', {
            method: 'POST',
            body: JSON.stringify(card),
        });
    }

    async updateCreditCard(id: string, card: Partial<CreditCard>): Promise<CreditCard> {
        return fetchWithAuth(`/credit-cards/${id}`, {
            method: 'PUT',
            body: JSON.stringify(card),
        });
    }

    async deleteCreditCard(id: string): Promise<void> {
        return fetchWithAuth(`/credit-cards/${id}`, { method: 'DELETE' });
    }

    async payInvoice(cardId: string, amount: number, date: string): Promise<any> {
        return fetchWithAuth(`/credit-cards/${cardId}/pay-invoice`, {
            method: 'POST',
            body: JSON.stringify({ amount, date }),
        });
    }

    async cancelInvoicePayment(paymentId: string): Promise<void> {
        // Updated to use the correct route
        return fetchWithAuth(`/invoice-payments/${paymentId}`, {
            method: 'DELETE',
        });
    }

    async getInvoicePayments(cardId: string): Promise<any[]> {
        return fetchWithAuth(`/credit-cards/${cardId}/invoice-payments`);
    }

    async categorizeNotification(text: string, packageName: string, timestamp: number): Promise<any> {
        return fetchWithAuth('/ai/categorize', {
            method: 'POST',
            body: JSON.stringify({ rawText: text, packageName, timestamp }),
        });
    }

    async generateIntegrationKey(): Promise<{ key: string, expiresAt: string }> {
        return fetchWithAuth('/integrations/generate-key', { method: 'POST' });
    }

    async getFinanceSummary(): Promise<{ availableBalance: number; netWorth: number; monthlyIncome: number; monthlyExpenses: number }> {
        return fetchWithAuth('/finance/summary');
    }
}

