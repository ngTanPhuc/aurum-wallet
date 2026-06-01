import { Transaction, Category } from '../types';
import { isWithinInterval, startOfDay, endOfDay, format, parseISO, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';

export interface ChartDateRange {
  startDate: Date;
  endDate: Date;
}

// Helper to filter transactions and exclude transfers
export const filterTransactionsForCharts = (
  transactions: Transaction[],
  range: ChartDateRange
) => {
  return transactions.filter(t => {
    // Exclude transfers and adjustments
    if (t.type === 'transfer' || t.type === 'adjustment') return false;
    
    const d = parseISO(t.transactionDate);
    return isWithinInterval(d, {
      start: startOfDay(range.startDate),
      end: endOfDay(range.endDate)
    });
  });
};

// Generates data for the Donut Chart (Expenses by Category)
export const generateDonutChartData = (
  transactions: Transaction[],
  categories: Category[],
  range: ChartDateRange
) => {
  const filtered = filterTransactionsForCharts(transactions, range);
  const expenses = filtered.filter(t => t.type === 'expense');

  // Group by category
  const categoryTotals: Record<string, number> = {};
  let totalExpense = 0;

  expenses.forEach(t => {
    if (!t.categoryId) return;
    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    totalExpense += t.amount;
  });

  // Default color palette for categories if they don't have one
  const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F9D56E', '#FF9F1C', '#9D4EDD', '#2EC4B6', '#E71D36'];

  const data = Object.keys(categoryTotals)
    .map((categoryId, index) => {
      const cat = categories.find(c => c.id === categoryId);
      const amount = categoryTotals[categoryId];
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      const color = cat?.color || defaultColors[index % defaultColors.length];

      return {
        value: amount,
        color: color,
        gradientCenterColor: color, // For gifted-charts
        label: cat?.name || 'Unknown',
        text: `${percentage.toFixed(0)}%`, // Text inside pie slice
        percentage,
        amount,
        icon: cat?.icon
      };
    })
    .sort((a, b) => b.value - a.value); // Sort largest to smallest

  // Mark the largest slice as focused to pop out
  if (data.length > 0) {
    data[0] = { ...data[0], focused: true } as any;
  }

  return { data, totalExpense };
};

// Generates data for Income vs Expense Bar Chart
export const generateBarChartData = (
  transactions: Transaction[],
  range: ChartDateRange
) => {
  const filtered = filterTransactionsForCharts(transactions, range);
  
  // Decide grouping based on range duration
  const daysDiff = (range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24);
  const groupBy = daysDiff > 31 ? 'month' : 'day';

  const barData: any[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  if (groupBy === 'day') {
    const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
    days.forEach((day, index) => {
      const dayTxs = filtered.filter(t => isSameDay(parseISO(t.transactionDate), day));
      const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      totalIncome += income;
      totalExpense += expense;

      // Grouped bar: Income bar, then Expense bar
      barData.push({
        value: income,
        frontColor: '#10B981', // Emerald 500
        gradientColor: '#34D399',
        spacing: 2,
        label: index % Math.ceil(days.length / 7) === 0 ? format(day, 'MMM d') : '', // Show sparse labels
        labelWidth: 40,
        labelTextStyle: { color: '#6B7280', fontSize: 10, textAlign: 'center' }
      });
      barData.push({
        value: expense,
        frontColor: '#EF4444', // Red 500
        gradientColor: '#F87171',
        spacing: 20 // Gap between groups
      });
    });
  } else {
    // Group by month
    const months = eachMonthOfInterval({ start: startOfMonth(range.startDate), end: endOfMonth(range.endDate) });
    months.forEach(month => {
      const monthTxs = filtered.filter(t => isSameMonth(parseISO(t.transactionDate), month));
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      totalIncome += income;
      totalExpense += expense;

      barData.push({
        value: income,
        frontColor: '#10B981',
        gradientColor: '#34D399',
        spacing: 2,
        label: format(month, 'MMM yyyy'),
        labelWidth: 50,
        labelTextStyle: { color: '#6B7280', fontSize: 10, textAlign: 'center' }
      });
      barData.push({
        value: expense,
        frontColor: '#EF4444',
        gradientColor: '#F87171',
        spacing: 24
      });
    });
  }

  return { barData, totalIncome, totalExpense };
};
