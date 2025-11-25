import { addMonths, subMonths, setDate, startOfDay, endOfDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { CreditCard } from '../types';

export const getInvoiceDates = (closingDay: number, referenceDate: Date = new Date()) => {
    const currentDay = referenceDate.getDate();
    const currentMonth = referenceDate;

    let startDate: Date;
    let endDate: Date;

    // If today is before or on the closing day, the invoice closes THIS month.
    // So it started last month.
    if (currentDay <= closingDay) {
        const prevMonth = subMonths(currentMonth, 1);

        // Start date is closingDay + 1 of previous month
        startDate = setDate(prevMonth, closingDay + 1);

        // End date is closingDay of current month
        endDate = setDate(currentMonth, closingDay);
    } else {
        // If today is after the closing day, the invoice closes NEXT month.
        // So it started this month.

        // Start date is closingDay + 1 of current month
        startDate = setDate(currentMonth, closingDay + 1);

        // End date is closingDay of next month
        endDate = setDate(addMonths(currentMonth, 1), closingDay);
    }

    return {
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate)
    };
};

export const isExpenseInInvoice = (expenseDate: Date, invoiceStart: Date, invoiceEnd: Date) => {
    return (isAfter(expenseDate, invoiceStart) || isSameDay(expenseDate, invoiceStart)) &&
        (isBefore(expenseDate, invoiceEnd) || isSameDay(expenseDate, invoiceEnd));
};
