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

  it('returns empty data when there are no transactions', () => {
    const result = generateDonutChartData([], [], range);
    expect(result.data).toHaveLength(0);
    expect(result.totalExpense).toBe(0);
  });

  it('excludes transfers and adjustments from bar chart totals', () => {
    const txsWithAdjustment: Transaction[] = [
      ...transactions,
      { id: '5', type: 'adjustment', amount: 9999, transactionDate: '2026-06-01T10:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    ];
    const result = generateBarChartData(txsWithAdjustment, range);
    // Adjustment should not add to income or expense totals
    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(300);
  });

  it('groups categories beyond top 5 into "Other" bucket', () => {
    const categories: Category[] = Array.from({ length: 8 }, (_, i) => ({
      id: `cat${i}`,
      name: `Cat ${i}`,
      type: 'expense' as const,
      isDefault: false,
      isArchived: false,
      createdAt: '',
      updatedAt: '',
    }));

    const manyTxs: Transaction[] = categories.map((cat, i) => ({
      id: `tx${i}`,
      type: 'expense' as const,
      amount: (i + 1) * 100, // Different amounts to sort deterministically
      categoryId: cat.id,
      transactionDate: '2026-06-01T10:00:00Z',
      sourceWalletId: 'w1',
      createdAt: '',
      updatedAt: '',
      note: '',
    }));

    const result = generateDonutChartData(manyTxs, categories, range);
    // Top 5 + 1 "Other" = 6 items
    expect(result.data).toHaveLength(6);
    const otherItem = result.data.find(d => d.label === 'Other');
    expect(otherItem).toBeDefined();
    // Other should contain categories 0, 1, 2 (smallest: 100, 200, 300)
    expect(otherItem!.amount).toBe(100 + 200 + 300);
  });

  it('donut chart handles expenses with no categoryId gracefully', () => {
    const uncategorizedTx: Transaction[] = [
      { id: 'u1', type: 'expense', amount: 500, categoryId: undefined, transactionDate: '2026-06-01T10:00:00Z', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    ];
    // Should not throw
    expect(() => generateDonutChartData(uncategorizedTx, [], range)).not.toThrow();
    const result = generateDonutChartData(uncategorizedTx, [], range);
    // Uncategorized expenses are skipped (no categoryId)
    expect(result.data).toHaveLength(0);
    expect(result.totalExpense).toBe(0);
  });
});

