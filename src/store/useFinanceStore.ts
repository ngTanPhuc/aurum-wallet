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

import { PersonService } from '../services/PersonService';
import { DebtService } from '../services/DebtService';

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
  people: Person[];
  debts: Debt[];
  debtPayments: DebtPayment[];
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

  addPerson: (person: Person) => Promise<void>;
  updatePerson: (person: Person) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;

  addDebt: (debt: Debt, tx: Transaction) => Promise<void>;
  recordDebtPayment: (payment: DebtPayment, tx: Transaction, updatedDebt: Debt) => Promise<void>;
  updateDebtStatus: (id: string, status: string) => Promise<void>;
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
  people: [],
  debts: [],
  debtPayments: [],
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
        templates, tags, savingsDeposits, yieldPocketSettings,
        people, debts, debtPayments
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
        YieldPocketService.getSettings(),
        PersonService.getPeople(),
        DebtService.getDebts(),
        DebtService.getDebtPayments()
      ]);
      
      set({ wallets, categories, transactions, savingsGoals, recurringTransactions, pendingRecurringTransactions, templates, tags, savingsDeposits, yieldPocketSettings, people, debts, debtPayments, isLoading: false });
    } catch (error) {
      console.error('Error loading finance data', error);
      set({ isLoading: false });
    }
  },

  addWallet: async (wallet: Wallet) => {
    await WalletService.addWallet(wallet);
    const wallets = await WalletService.getWallets();
    set({ wallets });
  },

  updateWallet: async (wallet: Wallet) => {
    await WalletService.updateWallet(wallet);
    const wallets = await WalletService.getWallets();
    set({ wallets });
  },

  addCategory: async (category: Category) => {
    await CategoryService.addCategory(category);
    const categories = await CategoryService.getCategories();
    set({ categories });
  },

  addTransaction: async (tx: Transaction) => {
    const { wallets, savingsGoals, transactions } = get();

    // 1. Optimistic Update
    let updatedWallets = [...wallets];
    let updatedGoals = [...savingsGoals];

    if (tx.type === 'expense') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) } : w);
      if (tx.savingsGoalId) {
        updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: g.currentAmount + tx.amount } : g);
      }
    } else if (tx.type === 'income') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance + tx.amount } : w);
      if (tx.savingsGoalId) {
        updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - tx.amount) } : g);
      }
    } else if (tx.type === 'transfer' && tx.destinationWalletId) {
      updatedWallets = updatedWallets.map(w => {
        if (w.id === tx.sourceWalletId) return { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) };
        if (w.id === tx.destinationWalletId) return { ...w, balance: w.balance + tx.amount };
        return w;
      });
    }

    updatedGoals = updatedGoals.map(g => ({ ...g, isCompleted: g.currentAmount >= g.targetAmount }));

    set({
      wallets: updatedWallets,
      savingsGoals: updatedGoals,
      transactions: [tx, ...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    });

    // 2. Background DB Write
    TransactionService.addTransaction(tx).catch(async (error) => {
      console.error('Background save failed, reverting state:', error);
      await get().loadData();
    });
  },

  updateTransaction: async (tx: Transaction) => {
    const { wallets, savingsGoals, transactions } = get();
    const oldTx = transactions.find(t => t.id === tx.id);
    
    // 1. Optimistic Update
    let updatedWallets = [...wallets];
    let updatedGoals = [...savingsGoals];

    // Revert old tx effects
    if (oldTx) {
      if (oldTx.type === 'expense') {
        updatedWallets = updatedWallets.map(w => w.id === oldTx.sourceWalletId ? { ...w, balance: w.balance + (oldTx.amount + (oldTx.fee || 0)) } : w);
        if (oldTx.savingsGoalId) {
          updatedGoals = updatedGoals.map(g => g.id === oldTx.savingsGoalId ? { ...g, currentAmount: g.currentAmount - oldTx.amount } : g);
        }
      } else if (oldTx.type === 'income') {
        updatedWallets = updatedWallets.map(w => w.id === oldTx.sourceWalletId ? { ...w, balance: w.balance - oldTx.amount } : w);
        if (oldTx.savingsGoalId) {
          updatedGoals = updatedGoals.map(g => g.id === oldTx.savingsGoalId ? { ...g, currentAmount: g.currentAmount + oldTx.amount } : g);
        }
      } else if (oldTx.type === 'transfer' && oldTx.destinationWalletId) {
        updatedWallets = updatedWallets.map(w => {
          if (w.id === oldTx.sourceWalletId) return { ...w, balance: w.balance + (oldTx.amount + (oldTx.fee || 0)) };
          if (w.id === oldTx.destinationWalletId) return { ...w, balance: w.balance - oldTx.amount };
          return w;
        });
      }
    }

    // Apply new tx effects
    if (tx.type === 'expense') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) } : w);
      if (tx.savingsGoalId) {
        updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: g.currentAmount + tx.amount } : g);
      }
    } else if (tx.type === 'income') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance + tx.amount } : w);
      if (tx.savingsGoalId) {
        updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - tx.amount) } : g);
      }
    } else if (tx.type === 'transfer' && tx.destinationWalletId) {
      updatedWallets = updatedWallets.map(w => {
        if (w.id === tx.sourceWalletId) return { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) };
        if (w.id === tx.destinationWalletId) return { ...w, balance: w.balance + tx.amount };
        return w;
      });
    }

    updatedGoals = updatedGoals.map(g => ({ ...g, isCompleted: g.currentAmount >= g.targetAmount }));

    set({
      wallets: updatedWallets,
      savingsGoals: updatedGoals,
      transactions: transactions.map(t => t.id === tx.id ? tx : t).sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    });

    // 2. Background DB Write
    TransactionService.updateTransaction(tx).catch(async (error) => {
      console.error('Background update failed, reverting state:', error);
      await get().loadData();
    });
  },

  deleteTransaction: async (id: string) => {
    const { wallets, savingsGoals, transactions } = get();
    const tx = transactions.find(t => t.id === id);
    
    // 1. Optimistic Update
    let updatedWallets = [...wallets];
    let updatedGoals = [...savingsGoals];

    // Revert tx effects
    if (tx) {
      if (tx.type === 'expense') {
        updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance + (tx.amount + (tx.fee || 0)) } : w);
        if (tx.savingsGoalId) {
          updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - tx.amount) } : g);
        }
      } else if (tx.type === 'income') {
        updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance - tx.amount } : w);
        if (tx.savingsGoalId) {
          updatedGoals = updatedGoals.map(g => g.id === tx.savingsGoalId ? { ...g, currentAmount: g.currentAmount + tx.amount } : g);
        }
      } else if (tx.type === 'transfer' && tx.destinationWalletId) {
        updatedWallets = updatedWallets.map(w => {
          if (w.id === tx.sourceWalletId) return { ...w, balance: w.balance + (tx.amount + (tx.fee || 0)) };
          if (w.id === tx.destinationWalletId) return { ...w, balance: w.balance - tx.amount };
          return w;
        });
      }
    }

    updatedGoals = updatedGoals.map(g => ({ ...g, isCompleted: g.currentAmount >= g.targetAmount }));

    set({
      wallets: updatedWallets,
      savingsGoals: updatedGoals,
      transactions: transactions.filter(t => t.id !== id)
    });

    // 2. Background DB Write
    TransactionService.deleteTransaction(id).catch(async (error) => {
      console.error('Background delete failed, reverting state:', error);
      await get().loadData();
    });
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
    const savingsGoals = await SavingsGoalService.getSavingsGoals();
    set({ savingsGoals });
  },

  updateSavingsGoal: async (goal: SavingsGoal) => {
    await SavingsGoalService.updateSavingsGoal(goal);
    const savingsGoals = await SavingsGoalService.getSavingsGoals();
    set({ savingsGoals });
  },

  deleteSavingsGoal: async (id: string) => {
    await SavingsGoalService.deleteSavingsGoal(id);
    const savingsGoals = await SavingsGoalService.getSavingsGoals();
    set({ savingsGoals });
  },

  addRecurringTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.addRecurringTransaction(rt);
    const recurringTransactions = await RecurringTransactionService.getRecurringTransactions();
    set({ recurringTransactions });
  },

  updateRecurringTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.updateRecurringTransaction(rt);
    const recurringTransactions = await RecurringTransactionService.getRecurringTransactions();
    set({ recurringTransactions });
  },

  deleteRecurringTransaction: async (id: string) => {
    await RecurringTransactionService.deleteRecurringTransaction(id);
    const recurringTransactions = await RecurringTransactionService.getRecurringTransactions();
    set({ recurringTransactions });
  },

  loadPendingRecurringTransactions: async () => {
    const pendingRecurringTransactions = await RecurringTransactionService.getPendingTransactions();
    set({ pendingRecurringTransactions });
  },

  confirmPendingTransaction: async (rt: RecurringTransaction, txData?: Partial<Transaction>) => {
    await RecurringTransactionService.confirmPendingTransaction(rt, txData);
    const [wallets, transactions, pendingRecurringTransactions, recurringTransactions] = await Promise.all([
      WalletService.getWallets(),
      TransactionService.getTransactions(),
      RecurringTransactionService.getPendingTransactions(),
      RecurringTransactionService.getRecurringTransactions()
    ]);
    set({ wallets, transactions, pendingRecurringTransactions, recurringTransactions });
  },

  skipPendingTransaction: async (rt: RecurringTransaction) => {
    await RecurringTransactionService.skipPendingTransaction(rt);
    const [pendingRecurringTransactions, recurringTransactions] = await Promise.all([
      RecurringTransactionService.getPendingTransactions(),
      RecurringTransactionService.getRecurringTransactions()
    ]);
    set({ pendingRecurringTransactions, recurringTransactions });
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
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonthTxs = state.transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() + 1 === previousMonth && d.getFullYear() === previousYear;
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
      return d.getMonth() + 1 === month && d.getFullYear() === year;
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
      return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
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
    const templates = await TransactionTemplateService.getTemplates();
    set({ templates });
  },
  updateTemplate: async (template) => {
    await TransactionTemplateService.updateTemplate(template);
    const templates = await TransactionTemplateService.getTemplates();
    set({ templates });
  },
  deleteTemplate: async (id) => {
    await TransactionTemplateService.deleteTemplate(id);
    const templates = await TransactionTemplateService.getTemplates();
    set({ templates });
  },

  addTag: async (tag) => {
    await TagService.addTag(tag);
    const tags = await TagService.getTags();
    set({ tags });
  },
  updateTag: async (tag) => {
    await TagService.updateTag(tag);
    const tags = await TagService.getTags();
    set({ tags });
  },
  deleteTag: async (id) => {
    await TagService.deleteTag(id);
    const tags = await TagService.getTags();
    set({ tags });
  },

  addSavingsDeposit: async (deposit) => {
    await SavingsDepositService.addSavingsDeposit(deposit);
    const [savingsDeposits, wallets, transactions] = await Promise.all([
      SavingsDepositService.getSavingsDeposits(), WalletService.getWallets(), TransactionService.getTransactions()
    ]);
    set({ savingsDeposits, wallets, transactions });
  },
  updateSavingsDeposit: async (deposit) => {
    await SavingsDepositService.updateSavingsDeposit(deposit);
    const savingsDeposits = await SavingsDepositService.getSavingsDeposits();
    set({ savingsDeposits });
  },
  matureSavingsDeposit: async (deposit) => {
    await SavingsDepositService.matureDeposit(deposit);
    const [savingsDeposits, wallets, transactions] = await Promise.all([
      SavingsDepositService.getSavingsDeposits(), WalletService.getWallets(), TransactionService.getTransactions()
    ]);
    set({ savingsDeposits, wallets, transactions });
  },
  closeSavingsDepositEarly: async (deposit) => {
    await SavingsDepositService.closeEarly(deposit);
    const [savingsDeposits, wallets, transactions] = await Promise.all([
      SavingsDepositService.getSavingsDeposits(), WalletService.getWallets(), TransactionService.getTransactions()
    ]);
    set({ savingsDeposits, wallets, transactions });
  },
  saveYieldPocketSettings: async (settings) => {
    await YieldPocketService.saveSettings(settings);
    const yieldPocketSettings = await YieldPocketService.getSettings();
    set({ yieldPocketSettings });
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
  },

  addPerson: async (person) => {
    set(state => ({ people: [...state.people, person].sort((a, b) => a.name.localeCompare(b.name)) }));
    PersonService.addPerson(person).catch(async (e) => {
      console.error(e);
      await get().loadData();
    });
  },
  updatePerson: async (person) => {
    set(state => ({ people: state.people.map(p => p.id === person.id ? person : p).sort((a, b) => a.name.localeCompare(b.name)) }));
    PersonService.updatePerson(person).catch(async (e) => {
      console.error(e);
      await get().loadData();
    });
  },
  deletePerson: async (id) => {
    set(state => ({ people: state.people.filter(p => p.id !== id) }));
    PersonService.deletePerson(id).catch(async (e) => {
      console.error(e);
      await get().loadData();
    });
  },

  addDebt: async (debt, tx) => {
    const { wallets, transactions, debts } = get();
    let updatedWallets = [...wallets];
    
    // Optimistically update wallet
    if (tx.type === 'expense') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) } : w);
    } else if (tx.type === 'income') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance + tx.amount } : w);
    }

    set({
      wallets: updatedWallets,
      transactions: [tx, ...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()),
      debts: [debt, ...debts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });

    DebtService.createDebtWithTransaction(debt, tx).catch(async (e) => {
      console.error('Background addDebt failed', e);
      await get().loadData();
    });
  },

  recordDebtPayment: async (payment, tx, updatedDebt) => {
    const { wallets, transactions, debts, debtPayments } = get();
    let updatedWallets = [...wallets];
    
    if (tx.type === 'expense') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance - (tx.amount + (tx.fee || 0)) } : w);
    } else if (tx.type === 'income') {
      updatedWallets = updatedWallets.map(w => w.id === tx.sourceWalletId ? { ...w, balance: w.balance + tx.amount } : w);
    }

    set({
      wallets: updatedWallets,
      transactions: [tx, ...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()),
      debts: debts.map(d => d.id === updatedDebt.id ? updatedDebt : d),
      debtPayments: [payment, ...debtPayments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    });

    DebtService.recordDebtPayment(payment, tx, updatedDebt).catch(async (e) => {
      console.error('Background recordDebtPayment failed', e);
      await get().loadData();
    });
  },

  updateDebtStatus: async (id, status) => {
    set(state => ({
      debts: state.debts.map(d => d.id === id ? { ...d, status: status as any } : d)
    }));
    DebtService.updateDebtStatus(id, status).catch(async (e) => {
      console.error('Background updateDebtStatus failed', e);
      await get().loadData();
    });
  }
}));
