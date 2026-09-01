import { InsightEngine } from '../InsightEngine';
import { Transaction, Budget, SavingsGoal, Category } from '../../types';

// Helper: simple mock of getBudgetProgress that calculates monthly spend from transactions
function makeMockGetBudgetProgress(transactions: Transaction[]) {
  return (budgetId: string, targetDate: string) => {
    const now = new Date(targetDate);
    const month = now.getMonth();
    const year = now.getFullYear();

    // Find the budget from the test budgets list
    const allBudgets: Budget[] = [
      { id: 'b1', name: 'Test Budget', amount: 1000, targetType: 'category', targetId: 'c1', recurrence: 'monthly', startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Test Budget', amount: 1000, targetType: 'category', targetId: 'c-unknown', recurrence: 'monthly', startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' },
      { id: 'bz', name: 'Test Budget', amount: 0, targetType: 'category', targetId: 'c1', recurrence: 'monthly', startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' },
    ];
    const budget = allBudgets.find(b => b.id === budgetId);
    if (!budget) return { spent: 0, budgeted: 0, remaining: 0, percentage: 0, cycleStart: '', cycleEnd: '' };

    const spent = transactions
      .filter(t => {
        const d = new Date(t.transactionDate);
        return d.getMonth() === month && d.getFullYear() === year &&
          t.type === 'expense' && t.categoryId === budget.targetId;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const budgeted = budget.amount;
    const remaining = budgeted - spent;
    const percentage = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
    return { spent, budgeted, remaining, percentage, cycleStart: '', cycleEnd: '' };
  };
}

describe('InsightEngine', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2023-06-20T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const categories: Category[] = [
    { id: 'c1', name: 'Food', type: 'expense', isDefault: false, isArchived: false, createdAt: '', updatedAt: '', }
  ];

  const budgets: Budget[] = [
    { id: 'b1', name: 'Test Budget', amount: 1000, targetType: 'category' as any, targetId: 'c1', recurrence: 'monthly' as any, startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' }
  ];

  it('should generate savings rate good insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 5000, type: 'income', categoryId: 'c2', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-16', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const savingsInsight = insights.find(i => i.id === 'savings_rate_good');

    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.title).toBe('Great Savings Rate!');
  });

  it('should generate negative cash flow insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 1000, type: 'income', categoryId: 'c2', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-16', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const savingsInsight = insights.find(i => i.id === 'savings_rate_negative');

    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.title).toBe('Negative Cash Flow');
  });

  it('should generate budget exceeded insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 1200, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const budgetInsight = insights.find(i => i.id === 'budget_exceeded_b1');

    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.title).toBe('Budget Exceeded');
    // Should say "exceeded by" and include the percentage used
    expect(budgetInsight?.description).toContain('120%');
  });

  it('should generate budget hit limit message at exactly 100%', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const budgetInsight = insights.find(i => i.id === 'budget_exceeded_b1');

    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.description).toContain('100% used');
    expect(budgetInsight?.description).not.toContain('exceeded by');
  });

  it('should generate nearing budget limit insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 850, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const budgetInsight = insights.find(i => i.id === 'budget_warning_b1');

    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.title).toBe('Nearing Budget Limit');
    expect(budgetInsight?.description).toContain('85%');
  });

  it('should generate spending increase insight (pro-rated)', () => {
    // Day 20 of June. Previous month May: 1000 spent full month.
    // Pro-rated May = 1000 * (20/31) = ~645.
    // Current June = 2000. Increase = (2000 - 645) / 645 = ~210% → fires alert
    const transactions: Transaction[] = [
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-05-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const spendInsight = insights.find(i => i.id === 'spending_increase');

    expect(spendInsight).toBeDefined();
    expect(spendInsight?.title).toBe('Spending Alert');
  });

  it('should generate spending decrease insight', () => {
    // Day 20 June. May full = 1000. Pro-rated = 1000*(20/31)=645. June = 200.
    // Decrease = (200-645)/645 = -69% → fires decrease
    const transactions: Transaction[] = [
      { id: '1', amount: 200, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-05-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    const spendInsight = insights.find(i => i.id === 'spending_decrease');

    expect(spendInsight).toBeDefined();
    expect(spendInsight?.title).toBe('Great Job!');
  });

  it('should handle zero previous expense', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories, makeMockGetBudgetProgress(transactions));
    expect(insights.find(i => i.id === 'spending_increase')).toBeUndefined();
    expect(insights.find(i => i.id === 'spending_decrease')).toBeUndefined();
  });

  it('should handle missing category for budget', () => {
    const badBudgets: Budget[] = [
      { id: 'b2', name: 'Test Budget', amount: 1000, targetType: 'category' as any, targetId: 'c-unknown', recurrence: 'monthly' as any, startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' }
    ];
    const transactions: Transaction[] = [
      { id: '1', amount: 1200, type: 'expense', categoryId: 'c-unknown', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, badBudgets, [], categories, makeMockGetBudgetProgress(transactions));
    const budgetInsight = insights.find(i => i.id === 'budget_exceeded_b2');

    expect(budgetInsight).toBeDefined();
    // Budget name is "Test Budget" not "Unknown budget" — we now use budget.name
    expect(budgetInsight?.description).toContain('Test Budget');
  });

  it('should test previous month wrap-around to previous year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-01-20T12:00:00Z'));

    const transactions: Transaction[] = [
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-01-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2022-12-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];

    const insights = InsightEngine.generateInsights(transactions, [], [], categories, makeMockGetBudgetProgress(transactions));
    const spendInsight = insights.find(i => i.id === 'spending_increase');

    expect(spendInsight).toBeDefined();
  });

  it('should show softened no-income warning when there are expenses but NO income', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-06-20T12:00:00Z'));

    const transactions: Transaction[] = [
      { id: '1', amount: 500, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-10', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    ];

    const insights = InsightEngine.generateInsights(transactions, [], [], categories, makeMockGetBudgetProgress(transactions));
    // Bug 3 fix: id changed to 'no_income_recorded', wording softened
    const noIncomeInsight = insights.find(i => i.id === 'no_income_recorded');

    expect(noIncomeInsight).toBeDefined();
    expect(noIncomeInsight?.description).toContain('No income recorded');
  });

  it('should NOT generate savings rate insight when rate is between 0% and 20%', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-06-20T12:00:00Z'));

    const transactions: Transaction[] = [
      { id: '1', amount: 1000, type: 'income', categoryId: 'c2', transactionDate: '2023-06-10', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
      { id: '2', amount: 850, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-11', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    ];

    const insights = InsightEngine.generateInsights(transactions, [], [], categories, makeMockGetBudgetProgress(transactions));
    expect(insights.find(i => i.id === 'savings_rate_good')).toBeUndefined();
    expect(insights.find(i => i.id === 'savings_rate_negative')).toBeUndefined();
  });

  it('should handle budget with zero amount without dividing by zero', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-06-20T12:00:00Z'));

    const zeroBudgets: Budget[] = [
      { id: 'bz', name: 'Test Budget', amount: 0, targetType: 'category' as any, targetId: 'c1', recurrence: 'monthly' as any, startDate: '2023-06-01T00:00:00.000Z', createdAt: '', updatedAt: '' }
    ];
    const transactions: Transaction[] = [
      { id: '1', amount: 100, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '' },
    ];

    expect(() => InsightEngine.generateInsights(transactions, zeroBudgets, [], categories, makeMockGetBudgetProgress(transactions))).not.toThrow();
    const insight = InsightEngine.generateInsights(transactions, zeroBudgets, [], categories, makeMockGetBudgetProgress(transactions));
    expect(insight.find(i => i.id === 'budget_exceeded_bz')).toBeUndefined();
    expect(insight.find(i => i.id === 'budget_warning_bz')).toBeUndefined();
  });
});
