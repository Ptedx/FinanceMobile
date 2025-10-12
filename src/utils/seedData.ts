import { db } from '../services/database';
import { format, subDays } from 'date-fns';

export const seedDemoData = async () => {
  try {
    const expenses = await db.getExpenses();
    if (expenses.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');

    await db.addExpense({
      category: 'food',
      value: 45.90,
      date: format(subDays(today, 2), 'yyyy-MM-dd'),
      paymentMethod: 'credit',
      isRecurring: false,
      description: 'Almoço no restaurante',
    });

    await db.addExpense({
      category: 'transport',
      value: 150.00,
      date: format(subDays(today, 5), 'yyyy-MM-dd'),
      paymentMethod: 'debit',
      isRecurring: false,
      description: 'Uber para reunião',
    });

    await db.addExpense({
      category: 'entertainment',
      value: 80.00,
      date: format(subDays(today, 3), 'yyyy-MM-dd'),
      paymentMethod: 'pix',
      isRecurring: false,
      description: 'Cinema com amigos',
    });

    await db.addExpense({
      category: 'bills',
      value: 200.00,
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      paymentMethod: 'debit',
      isRecurring: true,
      description: 'Conta de luz',
    });

    await db.setBudget({
      category: 'food',
      limitAmount: 500,
      month: currentMonth,
    });

    await db.setBudget({
      category: 'transport',
      limitAmount: 300,
      month: currentMonth,
    });

    await db.setBudget({
      category: 'entertainment',
      limitAmount: 200,
      month: currentMonth,
    });

    await db.addGoal({
      title: 'Viagem de Férias',
      targetAmount: 3000,
      currentAmount: 1200,
      targetDate: format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd'),
      type: 'save',
    });

    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};
