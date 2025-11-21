import { ExpenseCategory, PaymentMethod, IncomeCategory } from '../types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'Alimentação', icon: 'food' },
  { value: 'transport', label: 'Transporte', icon: 'car' },
  { value: 'health', label: 'Saúde', icon: 'medical-bag' },
  { value: 'entertainment', label: 'Lazer', icon: 'gamepad-variant' },
  { value: 'shopping', label: 'Compras', icon: 'shopping' },
  { value: 'bills', label: 'Contas', icon: 'file-document' },
  { value: 'education', label: 'Educação', icon: 'school' },
  { value: 'other', label: 'Outros', icon: 'dots-horizontal' },
];

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: 'salary', label: 'Salário', icon: 'cash-multiple' },
  { value: 'freelance', label: 'Freelance', icon: 'briefcase' },
  { value: 'investment', label: 'Investimentos', icon: 'chart-line' },
  { value: 'gift', label: 'Presente', icon: 'gift' },
  { value: 'other', label: 'Outros', icon: 'dots-horizontal' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Dinheiro', icon: 'cash' },
  { value: 'credit', label: 'Crédito', icon: 'credit-card' },
  { value: 'debit', label: 'Débito', icon: 'credit-card-outline' },
  { value: 'pix', label: 'PIX', icon: 'qrcode' },
];

export const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',

  budget: {
    safe: '#10B981',
    warning: '#F59E0B',
    exceeded: '#EF4444',
  },

  categories: {
    food: '#F59E0B',
    transport: '#3B82F6',
    health: '#EF4444',
    entertainment: '#8B5CF6',
    shopping: '#EC4899',
    bills: '#6366F1',
    education: '#14B8A6',
    other: '#6B7280',
  },
};

export const getCategoryColor = (category: ExpenseCategory): string => {
  return COLORS.categories[category] || COLORS.categories.other;
};

export const getCategoryLabel = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || 'Outros';
};

export const getCategoryIcon = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.icon || 'dots-horizontal';
};

export const getIncomeCategoryLabel = (category: IncomeCategory): string => {
  return INCOME_CATEGORIES.find(c => c.value === category)?.label || 'Outros';
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || 'Desconhecido';
};
