import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './middleware/authMiddleware';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user: { id: user.id, name: user.name, email: user.email, themePreference: user.themePreference }, token });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Error registering user', details: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user: { id: user.id, name: user.name, email: user.email, themePreference: user.themePreference }, token });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Error logging in', details: error.message });
    }
});

app.put('/users/preferences', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { themePreference } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: { themePreference },
        });
        res.json({ success: true, themePreference: user.themePreference });
    } catch (error: any) {
        console.error('Update Preferences Error:', error);
        res.status(500).json({ error: 'Error updating preferences', details: error.message });
    }
});

// Protected Routes

// Expenses
app.get('/expenses', authMiddleware, async (req: AuthRequest, res) => {
    const { startDate, endDate } = req.query;
    const where: any = { userId: req.user!.userId };

    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
        };
    }

    const expenses = await prisma.expense.findMany({ where });
    res.json(expenses);
});

app.post('/expenses', authMiddleware, async (req: AuthRequest, res) => {
    const { category, value, date, paymentMethod, isRecurring, description } = req.body;
    const expense = await prisma.expense.create({
        data: {
            category,
            value,
            date: new Date(date),
            paymentMethod,
            isRecurring,
            description,
            userId: req.user!.userId,
        },
    });
    res.json(expense);
});

app.delete('/expenses/:id', authMiddleware, async (req: AuthRequest, res) => {
    await prisma.expense.deleteMany({
        where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
});

// Incomes
app.get('/incomes', authMiddleware, async (req: AuthRequest, res) => {
    const { startDate, endDate } = req.query;
    const where: any = { userId: req.user!.userId };

    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
        };
    }

    const incomes = await prisma.income.findMany({ where });
    res.json(incomes);
});

app.post('/incomes', authMiddleware, async (req: AuthRequest, res) => {
    const { category, value, date, isRecurring, description } = req.body;
    const income = await prisma.income.create({
        data: {
            category,
            value,
            date: new Date(date),
            isRecurring,
            description,
            userId: req.user!.userId,
        },
    });
    res.json(income);
});

app.delete('/incomes/:id', authMiddleware, async (req: AuthRequest, res) => {
    await prisma.income.deleteMany({
        where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
});

// Budgets
app.get('/budgets', authMiddleware, async (req: AuthRequest, res) => {
    const { month } = req.query;
    const where: any = { userId: req.user!.userId };
    if (month) where.month = month;

    const budgets = await prisma.budget.findMany({ where });
    console.log(`Fetched budgets for user: ${req.user!.userId}, count: ${budgets.length}`);
    res.json(budgets);
});

app.post('/budgets', authMiddleware, async (req: AuthRequest, res) => {
    const { category, limitAmount, month } = req.body;

    // Check if budget exists for this category/month
    const existing = await prisma.budget.findFirst({
        where: { userId: req.user!.userId, category, month }
    });

    if (existing) {
        const updated = await prisma.budget.update({
            where: { id: existing.id },
            data: { limitAmount }
        });
        return res.json(updated);
    }

    const budget = await prisma.budget.create({
        data: {
            category,
            limitAmount,
            month,
            userId: req.user!.userId,
        },
    });
    res.json(budget);
});

// Goals
app.get('/goals', authMiddleware, async (req: AuthRequest, res) => {
    const goals = await prisma.goal.findMany({ where: { userId: req.user!.userId } });
    res.json(goals);
});

app.post('/goals', authMiddleware, async (req: AuthRequest, res) => {
    const { title, targetAmount, currentAmount, targetDate, type, category } = req.body;
    const goal = await prisma.goal.create({
        data: {
            title,
            targetAmount,
            currentAmount,
            targetDate: new Date(targetDate),
            type,
            category,
            userId: req.user!.userId,
        },
    });
    res.json(goal);
});

app.put('/goals/:id', authMiddleware, async (req: AuthRequest, res) => {
    const { currentAmount } = req.body;
    const goal = await prisma.goal.updateMany({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { currentAmount },
    });
    res.json(goal);
});

app.delete('/goals/:id', authMiddleware, async (req: AuthRequest, res) => {
    await prisma.goal.deleteMany({
        where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
});

// Alerts
app.get('/alerts', authMiddleware, async (req: AuthRequest, res) => {
    const { unreadOnly } = req.query;
    const where: any = { userId: req.user!.userId };
    if (unreadOnly === 'true') where.isRead = false;

    const alerts = await prisma.alert.findMany({ where });
    res.json(alerts);
});

app.post('/alerts', authMiddleware, async (req: AuthRequest, res) => {
    const { type, message, category, isRead } = req.body;
    const alert = await prisma.alert.create({
        data: {
            type,
            message,
            category,
            isRead: isRead || false,
            userId: req.user!.userId,
        },
    });
    res.json(alert);
});

app.put('/alerts/:id/read', authMiddleware, async (req: AuthRequest, res) => {
    await prisma.alert.updateMany({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { isRead: true },
    });
    res.json({ success: true });
});

app.delete('/alerts/old', authMiddleware, async (req: AuthRequest, res) => {
    // Logic to clear old alerts could be added here
    // For now, let's just clear all read alerts or something similar if requested
    // The interface says clearOldAlerts(daysOld), so we might need a date check
    const { daysOld } = req.body;
    if (daysOld) {
        const date = new Date();
        date.setDate(date.getDate() - daysOld);
        await prisma.alert.deleteMany({
            where: {
                userId: req.user!.userId,
                createdAt: { lt: date }
            }
        });
    }
    res.json({ success: true });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
