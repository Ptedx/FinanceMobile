export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix';
export type ExpenseCategory = 'food' | 'transport' | 'health' | 'entertainment' | 'shopping' | 'bills' | 'education' | 'other';
export type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'gift' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  value: number;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  description?: string;
  createdAt: string;
}

export interface GoalAllocation {
  goalId: string;
  amount: number;
}

export interface Income {
  id: string;
  category: IncomeCategory;
  value: number;
  date: string;
  isRecurring: boolean;
  description?: string;
  goalAllocations?: GoalAllocation[];
  createdAt: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  limitAmount: number;
  month: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  type: 'save' | 'spend_limit';
  category?: ExpenseCategory;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'goal_progress' | 'unusual_spending';
  message: string;
  category?: ExpenseCategory;
  isRead: boolean;
  createdAt: string;
}

export interface BudgetProgress {
  category: ExpenseCategory;
  limitAmount: number;
  spent: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface DashboardData {
  monthlyTotal: number;
  budgetProgress: BudgetProgress[];
  goalProgress: number;
  projection: number;
  availableBalance: number;
}
