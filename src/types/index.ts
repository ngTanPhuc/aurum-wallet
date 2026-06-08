export type TransactionType = 'expense' | 'income' | 'transfer' | 'adjustment';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'credit' | 'custom';
export type CategoryType = 'expense' | 'income';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  initialBalance: number;
  currency: string;
  color?: string;
  icon?: string;
  includeInTotal: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  sourceWalletId: string;
  destinationWalletId?: string; // only for transfer
  categoryId?: string; // optional for transfer/adjustment
  savingsGoalId?: string; // optional for tracking goal funding
  note: string;
  transactionDate: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
  tags?: Tag[]; // populated by joins
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  walletId: string;
  destinationWalletId?: string;
  categoryId?: string;
  note: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  isSubscription?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  linkedWalletId?: string;
  color?: string;
  icon?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface TransactionTag {
  transactionId: string;
  tagId: string;
}

export interface TransactionTemplate {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  walletId: string;
  categoryId?: string;
  note: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultCurrency: string;
  pinEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  isFirstRun: boolean;
}

export type RootStackParamList = {
  HomeTabs: undefined;
  Onboarding: undefined;
  PinLock: { mode: 'create' | 'verify' | 'remove' };
  AddEditTransaction: { transactionId?: string; type?: 'expense' | 'income' | 'transfer' | 'adjustment'; savingsGoalId?: string };
  AddEditWallet: { walletId?: string };
  Budgets: undefined;
  AddEditBudget: { budgetId?: string; month?: number; year?: number };
  SavingsGoals: undefined;
  SavingsGoalDetail: { goalId: string };
  AddEditSavingsGoal: { goalId?: string };
  SavingsDeposits: undefined;
  SavingsDepositDetail: { depositId: string };
  AddEditSavingsDeposit: { depositId?: string };
  RecurringTransactions: undefined;
  AddEditRecurringTransaction: { recurringId?: string };
  PendingRecurring: undefined;
  SpendingCharts: undefined;
  Templates: undefined;
  AddEditTemplate: { templateId?: string };
  Tags: undefined;
  Subscriptions: undefined;
  Calendar: undefined;
  Settings: undefined;
  YieldPockets: undefined;
  AddEditYieldPocket: { walletId?: string };
  DebtDashboard: undefined;
  AddEditDebt: { debtId?: string; direction?: DebtDirection };
  DebtDetail: { debtId: string };
  RecordDebtPayment: { debtId: string };
  People: undefined;
  PersonDetail: { personId: string };
  AddEditPerson: { personId?: string };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Wallets: undefined;
  Plan: undefined;
  Insights: undefined;
};

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  walletIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
  types?: string[];
}

export type TransactionSort = 'newest' | 'oldest' | 'highest_amount' | 'lowest_amount';

export type SavingsDepositTermUnit = 'day' | 'month' | 'year';
export type SavingsDepositInterestPayoutType = 'at_maturity' | 'monthly' | 'upfront';

export interface SavingsDeposit {
  id: string;
  name: string;
  sourceWalletId: string;
  payoutWalletId: string;
  principalAmount: number;
  annualInterestRate: number;
  termValue: number;
  termUnit: SavingsDepositTermUnit;
  startDate: string;
  maturityDate: string;
  interestPayoutType: SavingsDepositInterestPayoutType;
  expectedInterestAmount: number;
  expectedTotalPayout: number;
  status: 'active' | 'matured' | 'closed_early';
  createdAt: string;
  updatedAt: string;
}

export interface YieldPocketSettings {
  walletId: string;
  annualYieldRate: number;
  yieldFrequency: 'daily' | 'monthly';
  postingMode: 'auto' | 'manual';
  lastYieldCalculatedAt?: string;
  nextYieldDate?: string;
  allowSpendingDirectly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  avatarColor?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DebtDirection = 'lent' | 'borrowed';
export type InterestType = 'none' | 'flat' | 'simple_annual';
export type DebtStatus = 'active' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Debt {
  id: string;
  personId: string;
  direction: DebtDirection;
  principalAmount: number;
  interestType: InterestType;
  interestRate: number;
  interestAmount: number;
  totalExpectedAmount: number;
  amountPaid: number;
  remainingAmount: number;
  walletId: string;
  categoryId?: string;
  startDate: string;
  dueDate?: string;
  status: DebtStatus;
  note?: string;
  openingTransactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  walletId: string;
  amount: number;
  paymentDate: string;
  note?: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

// Add these to RootStackParamList
// We will modify RootStackParamList below.

export * from './insights';
