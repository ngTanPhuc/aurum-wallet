import { InsightEngine } from '../InsightEngine';
import { Transaction, Budget, SavingsGoal, Category } from '../../types';

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
    { id: 'b1', categoryId: 'c1', amount: 1000, month: 6, year: 2023, createdAt: '', updatedAt: '', }
  ];

  it('should generate savings rate good insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 5000, type: 'income', categoryId: 'c2', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-16', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const savingsInsight = insights.find(i => i.id === 'savings_rate_good');
    
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.title).toBe('Great Savings Rate!');
  });

  it('should generate negative cash flow insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 1000, type: 'income', categoryId: 'c2', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      { id: '2', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-16', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const savingsInsight = insights.find(i => i.id === 'savings_rate_negative');
    
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.title).toBe('Negative Cash Flow');
  });

  it('should generate budget exceeded insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 1200, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const budgetInsight = insights.find(i => i.id === 'budget_exceeded_b1');
    
    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.title).toBe('Budget Exceeded');
  });

  it('should generate nearing budget limit insight', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 850, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const budgetInsight = insights.find(i => i.id === 'budget_warning_b1');
    
    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.title).toBe('Nearing Budget Limit');
  });

  it('should generate spending increase insight', () => {
    const transactions: Transaction[] = [
      // Current month expense
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      // Previous month expense (May)
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-05-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const spendInsight = insights.find(i => i.id === 'spending_increase');
    
    expect(spendInsight).toBeDefined();
    expect(spendInsight?.title).toBe('Spending Alert');
  });

  it('should generate spending decrease insight', () => {
    const transactions: Transaction[] = [
      // Current month expense
      { id: '1', amount: 800, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      // Previous month expense (May)
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2023-05-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const spendInsight = insights.find(i => i.id === 'spending_decrease');
    
    expect(spendInsight).toBeDefined();
    expect(spendInsight?.title).toBe('Great Job!');
  });
  
  it('should handle zero previous expense', () => {
    const transactions: Transaction[] = [
      // Current month expense
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, budgets, [], categories);
    const spendIncreaseInsight = insights.find(i => i.id === 'spending_increase');
    const spendDecreaseInsight = insights.find(i => i.id === 'spending_decrease');
    
    expect(spendIncreaseInsight).toBeUndefined();
    expect(spendDecreaseInsight).toBeUndefined();
  });

  it('should handle missing category for budget', () => {
    const badBudgets = [
      { id: 'b2', categoryId: 'c-unknown', amount: 1000, month: 6, year: 2023, createdAt: '', updatedAt: '', }
    ];
    const transactions: Transaction[] = [
      { id: '1', amount: 1200, type: 'expense', categoryId: 'c-unknown', transactionDate: '2023-06-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, badBudgets, [], categories);
    const budgetInsight = insights.find(i => i.id === 'budget_exceeded_b2');
    
    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.description).toContain('Unknown budget');
  });

  it('should test previous month wrap-around to previous year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-01-20T12:00:00Z'));
    
    const transactions: Transaction[] = [
      // Current month expense (Jan)
      { id: '1', amount: 2000, type: 'expense', categoryId: 'c1', transactionDate: '2023-01-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
      // Previous month expense (Dec of prev year)
      { id: '2', amount: 1000, type: 'expense', categoryId: 'c1', transactionDate: '2022-12-15', sourceWalletId: 'w1', createdAt: '', updatedAt: '', note: '', },
    ];
    
    const insights = InsightEngine.generateInsights(transactions, [], [], categories);
    const spendInsight = insights.find(i => i.id === 'spending_increase');
    
    expect(spendInsight).toBeDefined();
  });
});
