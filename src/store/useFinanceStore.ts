import { create } from 'zustand';
import { Wallet, Category, Transaction, Budget, SavingsGoal, RecurringTransaction, Insight, TransactionTemplate, Tag, TransactionFilters, TransactionSort, SavingsDeposit, YieldPocketSettings } from '../types';
import { WalletService } from '../services/WalletService';
import { CategoryService } from '../services/CategoryService';
import { TransactionService } from '../services/TransactionService';
import { BudgetService } from '../services/BudgetService';
import { SavingsGoalService } from '../services/SavingsGoalService';
import { RecurringTransactionService } from '../services/RecurringTransactionService';
import { InsightEngine } from '../services/InsightEngine';
import { TransactionTemplateService } from '../services/TransactionTemplateService';
import { TagService } from '../services/TagService';
import { SavingsDepositService } from '../services/SavingsDepositService';
import { YieldPocketService } from '../services/YieldPocketService';

interface FinanceState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];
  pendingRecurringTransactions: RecurringTransaction[];
  templates: TransactionTemplate[];
  tags: Tag[];
  savingsDeposits: SavingsDeposit[];
  yieldPocketSettings: YieldPocketSettings[];
  transactionFilters: TransactionFilters;
  transactionSearchQuery: string;
  transactionSort: TransactionSort;
  isLoading: boolean;
  loadData: () => Promise<void>;
  addWallet: (wallet: Wallet) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loadBudgetsForMonth: (month: number, year: number) => Promise<void>;
  getBudgetProgress: (categoryId: string, month: number, year: number) => { spent: number; budgeted: number; remaining: number; percentage: number };
  getTotalBalance: () => number;

  addSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  addRecurringTransaction: (rt: RecurringTransaction) => Promise<void>;
  updateRecurringTransaction: (rt: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  loadPendingRecurringTransactions: () => Promise<void>;
  confirmPendingTransaction: (rt: RecurringTransaction, txData?: Partial<Transaction>) => Promise<void>;
  skipPendingTransaction: (rt: RecurringTransaction) => Promise<void>;

  getSavingsRate: (month: number, year: number) => { rate: number; trend: number };
  getCashFlow: (month: number, year: number) => { net: number; isPositive: boolean };
  getLargestSpendingCategory: (month: number, year: number) => { categoryName: string; amount: number; percentage: number } | null;
  getInsights: () => Insight[];

  addTemplate: (template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (template: TransactionTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<void>;
  updateTag: (tag: Tag) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  addSavingsDeposit: (deposit: SavingsDeposit) => Promise<void>;
  updateSavingsDeposit: (deposit: SavingsDeposit) => Promise<void>;
  matureSavingsDeposit: (deposit: SavingsDeposit) => Promise<void>;
  closeSavingsDepositEarly: (deposit: SavingsDeposit) => Promise<void>;
  saveYieldPocketSettings: (settings: YieldPocketSettings) => Promise<void>;

  setTransactionFilters: (filters: TransactionFilters) => void;
  setTransactionSearchQuery: (query: string) => void;
  setTransactionSort: (sort: TransactionSort) => void;
  getFilteredTransactions: () => Transaction[];
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  wallets: [],
  categories: [],
  transactions: [],
  budgets: [],
  savingsGoals: [],
  recurringTransactions: [],
  pendingRecurringTransactions: [],
  templates: [],
  tags: [],
  savingsDeposits: [],
  yieldPocketSettings: [],
  transactionFilters: {},
  transactionSearchQuery: '',
  transactionSort: 'newest',
  isLoading: true,
  
  loadData: async () => {
    set({ isLoading: true });
    try {
      const [
        wallets, categories, transactions, savingsGoals, 
        recurringTransactions, pendingRecurringTransactions, 
        templates, tags, savingsDeposits, yieldPocketSettings
      ] = await Promise.all([
        WalletService.getWallets(),
        CategoryService.getCategories(),
        TransactionService.getTransactions(),
        SavingsGoalService.getSavingsGoals(),
        RecurringTransactionService.getRecurringTransactions(),
        RecurringTransactionService.getPendingTransactions(),
        TransactionTemplateService.getTemplates(),
        TagService.getTags(),
        SavingsDepositService.getSavingsDeposits(),
        YieldPocketService.getSettings()
      ]);
      
      set({ wallets, categories, transactions, savingsGoals, recurringTransactions, pendingRecurringTransactions, templates, tags, savingsDeposits, yieldPocketSettings, isLoading: false });
    } catch (error) {
      console.error('Error loading finance data', error);
      set({ isLoading: false });
    }
  },

  addWallet: async (wallet: Wallet) => {
    await WalletService.addWallet(wallet);
    await get().loadData(); // reload to get updated list
  },

  updateWallet: async (wallet: Wallet) => {
    await WalletService.updateWallet(wallet);
    await get().loadData();
  },

  addCategory: async (category: Category) => {
    await CategoryService.addCategory(category);
    await get().loadData();
  },

  addTransaction: async (tx: Transaction) => {
    await TransactionService.addTransaction(tx);
    
    // Defer state update to avoid blocking navigation animation
    setTimeout(async () => {
      // Only refetch affected aggregates to guarantee accuracy
      const [wallets, savingsGoals] = await Promise.all([
        WalletService.getWallets(),
        SavingsGoalService.getSavingsGoals()
      ]);
      
      set(state => ({
        wallets,
        savingsGoals,
        transactions: [tx, ...state.transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      }));
    }, 0);
  },

  updateTransaction: async (tx: Transaction) => {
    await TransactionService.updateTransaction(tx);
    
    setTimeout(async () => {
      const [wallets, savingsGoals] = await Promise.all([
        WalletService.getWallets(),
        SavingsGoalService.getSavingsGoals()
      ]);
      
      set(state => ({
        wallets,
        savingsGoals,
        transactions: state.transactions.map(t => t.id === tx.id ? tx : t).sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      }));
    }, 0);
  },

  deleteTransaction: async (id: string) => {
    await TransactionService.deleteTransaction(id);
    
    setTimeout(async () => {
      const [wallets, savingsGoals] = await Promise.all([
        WalletService.getWallets(),
        SavingsGoalService.getSavingsGoals()
      ]);
      
      set(state => ({
        wallets,
        savingsGoals,
        transactions: state.transactions.filter(t => t.id !== id)
      }));
    }, 0);
  },

  loadBudgetsForMonth: async (month: number, year: number) => {
    const budgets = await BudgetService.getBudgets(month, year);
    set({ budgets });
  },

  addBudget: async (budget: Budget) => {
    await BudgetService.addBudget(budget);
    set(state => ({ budgets: [...(state.budgets || []), budget] }));
  },

  updateBudget: async (budget: Budget) => {
    await BudgetService.updateBudget(budget);
    set(state => ({
      budgets: (state.budgets || []).map(b => b.id === budget.id ? budget : b)
    }));
  },

  deleteBudget: async (id: string) => {
    await BudgetService.deleteBudget(id);
    const now = new Date();
    await get().loadBudgetsForMonth(now.getMonth() + 1, now.getFullYear());
  },

  addSavingsGoal: async (goal: SavingsGoal) => {
    await SavingsGoalService.addSavingsGoal(goal);
    await get().loadData();
  },

  updateSavingsGoal: async (goal: SavingsGoal) => {
    await SavingsGoalService.updateSavingsGoal(goal);
    await get().loadData();
  },

  deleteSavingsGoal: async (id: string) => {
    await SavingsGoalService.deleteSavingsGoal(id);
    await get().loadData();
  },

  addRecurringTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.addRecurringTransaction(rt);
    await get().loadData();
  },

  updateRecurringTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.updateRecurringTransaction(rt);
    await get().loadData();
  },

  deleteRecurringTransaction: async (id: string) => {
    await RecurringTransactionService.deleteRecurringTransaction(id);
    await get().loadData();
  },

  loadPendingRecurringTransactions: async () => {
    const pendingRecurringTransactions = await RecurringTransactionService.getPendingTransactions();
    set({ pendingRecurringTransactions });
  },

  confirmPendingTransaction: async (rt: RecurringTransaction, txData?: Partial<Transaction>) => {
    await RecurringTransactionService.confirmPendingTransaction(rt, txData);
    await get().loadData(); // Reload wallets, txs, and pending items
  },

  skipPendingTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.skipPendingTransaction(rt);
    await get().loadData();
  },

  getBudgetProgress: (categoryId: string, month: number, year: number) => {
    const state = get();
    const budget = state.budgets.find(b => b.categoryId === categoryId && b.month === month && b.year === year);
    
    // Calculate total spent for this category in the given month
    const spent = state.transactions
      .filter(t => {
        const d = new Date(t.transactionDate);
        return t.type === 'expense' && 
               t.categoryId === categoryId && 
               d.getMonth() + 1 === month && 
               d.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const budgeted = budget ? budget.amount : 0;
    const remaining = budgeted - spent;
    const percentage = budgeted > 0 ? Math.min(100, Math.max(0, (spent / budgeted) * 100)) : 0;

    return { spent, budgeted, remaining, percentage };
  },

  getTotalBalance: () => {
    const { wallets } = get();
    return wallets
      .filter((w) => w.includeInTotal && !w.isArchived)
      .reduce((acc, w) => acc + w.balance, 0);
  },

  getSavingsRate: (month: number, year: number) => {
    const state = get();
    const currentMonthTxs = state.transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;
    const previousMonthTxs = state.transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
    });

    const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const previousIncome = previousMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const previousExpense = previousMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const currentRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;
    const previousRate = previousIncome > 0 ? ((previousIncome - previousExpense) / previousIncome) * 100 : 0;

    return { rate: currentRate, trend: currentRate - previousRate };
  },

  getCashFlow: (month: number, year: number) => {
    const state = get();
    const currentMonthTxs = state.transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = currentIncome - currentExpense;

    return { net: Math.abs(net), isPositive: net >= 0 };
  },

  getLargestSpendingCategory: (month: number, year: number) => {
    const state = get();
    const currentMonthTxs = state.transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === month && d.getFullYear() === year && t.type === 'expense';
    });

    if (currentMonthTxs.length === 0) return null;

    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    currentMonthTxs.forEach(t => {
      if (t.categoryId) {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    if (totalExpense === 0) return null;

    let largestCategoryId = '';
    let largestAmount = 0;

    Object.entries(categoryTotals).forEach(([catId, amount]) => {
      if (amount > largestAmount) {
        largestAmount = amount;
        largestCategoryId = catId;
      }
    });

    const category = state.categories.find(c => c.id === largestCategoryId);
    const percentage = (largestAmount / totalExpense) * 100;

    return {
      categoryName: category ? category.name : 'Unknown',
      amount: largestAmount,
      percentage
    };
  },

  getInsights: () => {
    const state = get();
    return InsightEngine.generateInsights(state.transactions, state.budgets, state.savingsGoals, state.categories);
  },

  addTemplate: async (template) => {
    await TransactionTemplateService.addTemplate(template);
    await get().loadData();
  },
  updateTemplate: async (template) => {
    await TransactionTemplateService.updateTemplate(template);
    await get().loadData();
  },
  deleteTemplate: async (id) => {
    await TransactionTemplateService.deleteTemplate(id);
    await get().loadData();
  },

  addTag: async (tag) => {
    await TagService.addTag(tag);
    await get().loadData();
  },
  updateTag: async (tag) => {
    await TagService.updateTag(tag);
    await get().loadData();
  },
  deleteTag: async (id) => {
    await TagService.deleteTag(id);
    await get().loadData();
  },

  addSavingsDeposit: async (deposit) => {
    await SavingsDepositService.addSavingsDeposit(deposit);
    await get().loadData();
  },
  updateSavingsDeposit: async (deposit) => {
    await SavingsDepositService.updateSavingsDeposit(deposit);
    await get().loadData();
  },
  matureSavingsDeposit: async (deposit) => {
    await SavingsDepositService.matureDeposit(deposit);
    await get().loadData();
  },
  closeSavingsDepositEarly: async (deposit) => {
    await SavingsDepositService.closeEarly(deposit);
    await get().loadData();
  },
  saveYieldPocketSettings: async (settings) => {
    await YieldPocketService.saveSettings(settings);
    await get().loadData();
  },

  setTransactionFilters: (filters) => set({ transactionFilters: filters }),
  setTransactionSearchQuery: (query) => set({ transactionSearchQuery: query }),
  setTransactionSort: (sort) => set({ transactionSort: sort }),

  getFilteredTransactions: () => {
    const { transactions, transactionFilters, transactionSearchQuery, transactionSort, categories, wallets } = get();
    let filtered = [...transactions];

    // Search query
    if (transactionSearchQuery) {
      const q = transactionSearchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const wal = wallets.find(w => w.id === t.sourceWalletId);
        return (
          t.note?.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          wal?.name.toLowerCase().includes(q) ||
          t.tags?.some(tag => tag.name.toLowerCase().includes(q))
        );
      });
    }

    // Filters
    const f = transactionFilters;
    if (f.dateFrom) {
      const from = new Date(f.dateFrom).getTime();
      filtered = filtered.filter(t => new Date(t.transactionDate).getTime() >= from);
    }
    if (f.dateTo) {
      const to = new Date(f.dateTo).getTime();
      filtered = filtered.filter(t => new Date(t.transactionDate).getTime() <= to);
    }
    if (f.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= f.minAmount!);
    }
    if (f.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= f.maxAmount!);
    }
    if (f.walletIds && f.walletIds.length > 0) {
      filtered = filtered.filter(t => f.walletIds!.includes(t.sourceWalletId));
    }
    if (f.categoryIds && f.categoryIds.length > 0) {
      filtered = filtered.filter(t => t.categoryId && f.categoryIds!.includes(t.categoryId));
    }
    if (f.types && f.types.length > 0) {
      filtered = filtered.filter(t => f.types!.includes(t.type));
    }
    if (f.tagIds && f.tagIds.length > 0) {
      filtered = filtered.filter(t => t.tags && t.tags.some(tag => f.tagIds!.includes(tag.id)));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (transactionSort) {
        case 'newest':
          return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
        case 'oldest':
          return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        case 'highest_amount':
          return b.amount - a.amount;
        case 'lowest_amount':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }
}));
