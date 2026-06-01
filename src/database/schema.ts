export const WALLETS_TABLE = `
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL,
  initialBalance REAL NOT NULL,
  currency TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  includeInTotal INTEGER NOT NULL DEFAULT 1,
  isArchived INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

export const CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  isDefault INTEGER NOT NULL DEFAULT 0,
  isArchived INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

export const TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  sourceWalletId TEXT NOT NULL,
  destinationWalletId TEXT,
  categoryId TEXT,
  savingsGoalId TEXT,
  note TEXT,
  transactionDate TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (sourceWalletId) REFERENCES wallets (id),
  FOREIGN KEY (destinationWalletId) REFERENCES wallets (id),
  FOREIGN KEY (categoryId) REFERENCES categories (id),
  FOREIGN KEY (savingsGoalId) REFERENCES savings_goals (id)
);
`;

export const BUDGETS_TABLE = `
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL,
  amount REAL NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories (id)
);
`;

export const RECURRING_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  walletId TEXT NOT NULL,
  destinationWalletId TEXT,
  categoryId TEXT,
  note TEXT,
  frequency TEXT NOT NULL,
  startDate TEXT NOT NULL,
  nextDueDate TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  isSubscription INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (walletId) REFERENCES wallets (id),
  FOREIGN KEY (destinationWalletId) REFERENCES wallets (id),
  FOREIGN KEY (categoryId) REFERENCES categories (id)
);
`;

export const SAVINGS_GOALS_TABLE = `
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL NOT NULL,
  targetDate TEXT,
  linkedWalletId TEXT,
  color TEXT,
  icon TEXT,
  isCompleted INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (linkedWalletId) REFERENCES wallets (id)
);
`;

export const APP_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const TRANSACTION_TEMPLATES_TABLE = `
CREATE TABLE IF NOT EXISTS transaction_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  walletId TEXT NOT NULL,
  categoryId TEXT,
  note TEXT,
  icon TEXT,
  color TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (walletId) REFERENCES wallets (id),
  FOREIGN KEY (categoryId) REFERENCES categories (id)
);
`;

export const TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  createdAt TEXT NOT NULL
);
`;

export const TRANSACTION_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS transaction_tags (
  transactionId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (transactionId, tagId),
  FOREIGN KEY (transactionId) REFERENCES transactions (id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
);
`;

export const ALL_SCHEMAS_V1 = [
  WALLETS_TABLE,
  CATEGORIES_TABLE,
  TRANSACTIONS_TABLE,
  BUDGETS_TABLE,
  RECURRING_TRANSACTIONS_TABLE,
  SAVINGS_GOALS_TABLE,
  APP_SETTINGS_TABLE,
];
