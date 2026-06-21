import { useFinanceStore } from '../useFinanceStore';
import { WalletService } from '../../services/WalletService';
import { CategoryService } from '../../services/CategoryService';
import { TransactionService } from '../../services/TransactionService';
import { BudgetService } from '../../services/BudgetService';
import { SavingsGoalService } from '../../services/SavingsGoalService';
import { RecurringTransactionService } from '../../services/RecurringTransactionService';
import { InsightEngine } from '../../services/InsightEngine';
import { TransactionTemplateService } from '../../services/TransactionTemplateService';
import { TagService } from '../../services/TagService';

jest.mock('../../services/WalletService');
jest.mock('../../services/CategoryService');
jest.mock('../../services/TransactionService', () => ({
  TransactionService: {
    getTransactions: jest.fn().mockResolvedValue([]),
    addTransaction: jest.fn().mockResolvedValue(undefined),
    updateTransaction: jest.fn().mockResolvedValue(undefined),
    deleteTransaction: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../services/BudgetService');
jest.mock('../../services/SavingsGoalService');
jest.mock('../../services/RecurringTransactionService');
jest.mock('../../services/InsightEngine');
jest.mock('../../services/TransactionTemplateService');
jest.mock('../../services/TagService');

describe('useFinanceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFinanceStore.setState({
      budgets: [],
      transactions: [],
      categories: [],
      wallets: [],
      savingsGoals: [],
      recurringTransactions: [],
      pendingRecurringTransactions: [],
      templates: [],
      tags: [],
      savingsDeposits: [],
      yieldPocketSettings: [],
      people: [],
      debts: [],
      debtPayments: [],
      transactionFilters: {},
      transactionSearchQuery: '',
      transactionSort: 'newest',
      isLoading: true,
    });
  });

  it('loads data', async () => {
    const store = useFinanceStore.getState();
    await store.loadData();
    expect(WalletService.getWallets).toHaveBeenCalled();
  });

  it('wallet actions', async () => {
    const store = useFinanceStore.getState();
    await store.addWallet({} as any);
    expect(WalletService.addWallet).toHaveBeenCalled();
    await store.updateWallet({} as any);
    expect(WalletService.updateWallet).toHaveBeenCalled();
  });

  it('category actions', async () => {
    const store = useFinanceStore.getState();
    await store.addCategory({} as any);
    expect(CategoryService.addCategory).toHaveBeenCalled();
  });

  it('transaction actions', async () => {
    const store = useFinanceStore.getState();
    await store.addTransaction({} as any);
    expect(TransactionService.addTransaction).toHaveBeenCalled();
    await store.updateTransaction({} as any);
    expect(TransactionService.updateTransaction).toHaveBeenCalled();
    await store.deleteTransaction('1');
    expect(TransactionService.deleteTransaction).toHaveBeenCalled();
  });

  it('budget actions', async () => {
    useFinanceStore.setState({ budgets: [] });
    const store = useFinanceStore.getState();
    await store.loadBudgetsForMonth(1, 2026);
    expect(BudgetService.getBudgets).toHaveBeenCalled();
    await store.addBudget({ id: '1' } as any);
    expect(BudgetService.addBudget).toHaveBeenCalled();
    await store.updateBudget({ id: '1' } as any);
    expect(BudgetService.updateBudget).toHaveBeenCalled();
    await store.deleteBudget('1');
    expect(BudgetService.deleteBudget).toHaveBeenCalled();
  });

  it('savings goal actions', async () => {
    const store = useFinanceStore.getState();
    await store.addSavingsGoal({} as any);
    expect(SavingsGoalService.addSavingsGoal).toHaveBeenCalled();
    await store.updateSavingsGoal({} as any);
    expect(SavingsGoalService.updateSavingsGoal).toHaveBeenCalled();
    await store.deleteSavingsGoal('1');
    expect(SavingsGoalService.deleteSavingsGoal).toHaveBeenCalled();
  });

  it('recurring transaction actions', async () => {
    const store = useFinanceStore.getState();
    await store.addRecurringTransaction({} as any);
    expect(RecurringTransactionService.addRecurringTransaction).toHaveBeenCalled();
    await store.updateRecurringTransaction({} as any);
    expect(RecurringTransactionService.updateRecurringTransaction).toHaveBeenCalled();
    await store.deleteRecurringTransaction('1');
    expect(RecurringTransactionService.deleteRecurringTransaction).toHaveBeenCalled();
    await store.loadPendingRecurringTransactions();
    expect(RecurringTransactionService.getPendingTransactions).toHaveBeenCalled();
    await store.confirmPendingTransaction({} as any);
    expect(RecurringTransactionService.confirmPendingTransaction).toHaveBeenCalled();
    await store.skipPendingTransaction({} as any);
    expect(RecurringTransactionService.skipPendingTransaction).toHaveBeenCalled();
  });

  it('template actions', async () => {
    const store = useFinanceStore.getState();
    await store.addTemplate({} as any);
    expect(TransactionTemplateService.addTemplate).toHaveBeenCalled();
    await store.updateTemplate({} as any);
    expect(TransactionTemplateService.updateTemplate).toHaveBeenCalled();
    await store.deleteTemplate('1');
    expect(TransactionTemplateService.deleteTemplate).toHaveBeenCalled();
  });

  it('tag actions', async () => {
    const store = useFinanceStore.getState();
    await store.addTag({} as any);
    expect(TagService.addTag).toHaveBeenCalled();
    await store.updateTag({} as any);
    expect(TagService.updateTag).toHaveBeenCalled();
    await store.deleteTag('1');
    expect(TagService.deleteTag).toHaveBeenCalled();
  });

  it('getBudgetProgress', () => {
    useFinanceStore.setState({
      budgets: [{ categoryId: 'c1', month: 1, year: 2026, amount: 100 } as any],
      transactions: [
        { type: 'expense', categoryId: 'c1', transactionDate: '2026-01-10T10:00:00Z', amount: 20 } as any
      ]
    });
    const result = useFinanceStore.getState().getBudgetProgress('c1', 1, 2026);
    expect(result.budgeted).toBe(100);
    expect(result.spent).toBe(20);
    expect(result.percentage).toBe(20);
  });

  it('getTotalBalance', () => {
    useFinanceStore.setState({
      wallets: [{ includeInTotal: true, isArchived: false, balance: 100 } as any, { includeInTotal: false, isArchived: false, balance: 200 } as any]
    });
    expect(useFinanceStore.getState().getTotalBalance()).toBe(100);
  });

  it('getSavingsRate and getCashFlow', () => {
    useFinanceStore.setState({
      transactions: [
        { type: 'income', amount: 1000, transactionDate: '2026-06-15T00:00:00Z' } as any,
        { type: 'expense', amount: 400, transactionDate: '2026-06-16T00:00:00Z' } as any,
        // previous month
        { type: 'income', amount: 1000, transactionDate: '2026-05-15T00:00:00Z' } as any,
        { type: 'expense', amount: 800, transactionDate: '2026-05-16T00:00:00Z' } as any,
      ]
    });
    const store = useFinanceStore.getState();
    const savings = store.getSavingsRate(6, 2026); // June (month 6 = June in JS where getMonth()+1 is used)
    expect(savings.rate).toBe(60); // 600/1000 * 100
    expect(savings.trend).toBe(40); // 60 - 20
    
    const cashFlow = store.getCashFlow(6, 2026);
    expect(cashFlow.net).toBe(600);
    expect(cashFlow.isPositive).toBe(true);
  });

  it('getLargestSpendingCategory', () => {
    useFinanceStore.setState({
      categories: [{ id: 'c1', name: 'Food' } as any],
      transactions: [
        { type: 'expense', categoryId: 'c1', amount: 50, transactionDate: '2026-06-15T00:00:00Z' } as any,
      ]
    });
    const result = useFinanceStore.getState().getLargestSpendingCategory(6, 2026);
    expect(result?.categoryName).toBe('Food');
  });

  it('getInsights', () => {
    useFinanceStore.getState().getInsights();
    expect(InsightEngine.generateInsights).toHaveBeenCalled();
  });

  it('filters and sorts transactions', () => {
    useFinanceStore.setState({
      transactions: [
        { id: '1', transactionDate: '2026-06-10T00:00:00Z', amount: 10, type: 'expense', categoryId: 'c1', sourceWalletId: 'w1', note: 'test' } as any,
        { id: '2', transactionDate: '2026-06-11T00:00:00Z', amount: 50, type: 'income', categoryId: 'c2', sourceWalletId: 'w1', note: 'other' } as any,
      ],
      categories: [{ id: 'c1', name: 'Food' } as any, { id: 'c2', name: 'Salary' } as any],
      wallets: [{ id: 'w1', name: 'Cash' } as any]
    });
    const store = useFinanceStore.getState();
    store.setTransactionSort('highest_amount');
    
    const filtered = store.getFilteredTransactions();
    expect(filtered[0].id).toBe('2');

    store.setTransactionFilters({ minAmount: 20 });
    const filtered2 = store.getFilteredTransactions();
    expect(filtered2.length).toBe(1);
    
    store.setTransactionSearchQuery('nonexistent');
    const filtered3 = store.getFilteredTransactions();
    expect(filtered3.length).toBe(0);
  });
});
