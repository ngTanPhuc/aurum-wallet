import { filterTransactionsForCharts, generateDonutChartData, generateBarChartData } from '../chartHelpers';
import { Transaction, Category } from '../../types';

describe('chartHelpers', () => {
  const transactions: Transaction[] = [
    { id: '1', type: 'expense', amount: 100, categoryId: 'cat1', transactionDate: '2026-06-01T10:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    { id: '2', type: 'expense', amount: 200, categoryId: 'cat2', transactionDate: '2026-06-01T15:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    { id: '3', type: 'income', amount: 500, categoryId: 'cat3', transactionDate: '2026-06-02T10:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    { id: '4', type: 'transfer', amount: 100, transactionDate: '2026-06-02T10:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
  ];

  const range = { startDate: new Date('2026-06-01T00:00:00Z'), endDate: new Date('2026-06-02T23:59:59Z') };
  const monthRange = { startDate: new Date('2026-01-01T00:00:00Z'), endDate: new Date('2026-06-02T23:59:59Z') }; // > 31 days

  it('filters transactions correctly', () => {
    const filtered = filterTransactionsForCharts(transactions, range);
    expect(filtered.length).toBe(3); // Excludes transfer
  });

  it('generates donut chart data', () => {
    const categories: Category[] = [{ id: 'cat1', name: 'Food', color: 'red', type: 'expense', icon: '🍔', isArchived: false, isDefault: false, createdAt: '', updatedAt: '' }];
    const result = generateDonutChartData(transactions, categories, range);
    expect(result.data.length).toBe(2); // cat1 and cat2
    expect(result.totalExpense).toBe(300);
  });

  it('generates bar chart data by day', () => {
    const result = generateBarChartData(transactions, range);
    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(300);
    expect(result.barData.length).toBeGreaterThanOrEqual(4);
  });

  it('generates bar chart data by month', () => {
    const result = generateBarChartData(transactions, monthRange);
    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(300);
    expect(result.barData.length).toBeGreaterThan(4); // 6 months * 2 bars
  });
});
