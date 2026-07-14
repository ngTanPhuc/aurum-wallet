import * as SQLite from 'expo-sqlite';
import { ALL_SCHEMAS_V1, ALL_INDEXES, TRANSACTION_TEMPLATES_TABLE, TAGS_TABLE, TRANSACTION_TAGS_TABLE, SAVINGS_DEPOSITS_TABLE, YIELD_POCKET_SETTINGS_TABLE, PEOPLE_TABLE, DEBTS_TABLE, DEBT_PAYMENTS_TABLE } from './schema';

export const DATABASE_NAME = 'aurum_v1.db';

let _dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (!_dbInstance) {
    _dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
    // WAL mode allows concurrent readers without corrupting prepared statement handles
    await _dbInstance.execAsync('PRAGMA journal_mode = WAL;');
    await _dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    await _dbInstance.execAsync('PRAGMA busy_timeout = 5000;');
  }
  return _dbInstance;
};

interface Migration {
  id: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'initial_schema_v1',
    up: async (db) => {
      for (const schema of ALL_SCHEMAS_V1) {
        await db.execAsync(schema);
      }
      for (const indexSql of ALL_INDEXES) {
        await db.execAsync(indexSql);
      }
    }
  },
  {
    id: 2,
    name: 'add_missing_foreign_keys',
    up: async (db) => {
      try {
        await db.execAsync('ALTER TABLE transactions ADD COLUMN savingsGoalId TEXT REFERENCES savings_goals(id);');
      } catch (e) {
        // Ignore if exists
      }
      try {
        await db.execAsync('ALTER TABLE recurring_transactions ADD COLUMN destinationWalletId TEXT REFERENCES wallets(id);');
      } catch (e) {
        // Ignore if exists
      }
    }
  },
  {
    id: 3,
    name: 'templates_and_tags',
    up: async (db) => {
      await db.execAsync(TRANSACTION_TEMPLATES_TABLE);
      await db.execAsync(TAGS_TABLE);
      await db.execAsync(TRANSACTION_TAGS_TABLE);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction ON transaction_tags(transactionId);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON transaction_tags(tagId);');
    }
  },
  {
    id: 4,
    name: 'add_subscription_flag',
    up: async (db) => {
      try {
        await db.execAsync('ALTER TABLE recurring_transactions ADD COLUMN isSubscription INTEGER NOT NULL DEFAULT 0;');
      } catch (e) {
        // Ignore if exists
      }
    }
  },
  {
    id: 5,
    name: 'add_recurring_transaction_name',
    up: async (db) => {
      try {
        await db.execAsync("ALTER TABLE recurring_transactions ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed';");
      } catch (e) {
        // Ignore if exists
      }
    }
  },
  {
    id: 6,
    name: 'add_fee_to_transactions',
    up: async (db) => {
      try {
        await db.execAsync('ALTER TABLE transactions ADD COLUMN fee REAL NOT NULL DEFAULT 0;');
      } catch (e) {}
      try {
        await db.execAsync('ALTER TABLE recurring_transactions ADD COLUMN fee REAL NOT NULL DEFAULT 0;');
      } catch (e) {}
      try {
        await db.execAsync('ALTER TABLE transaction_templates ADD COLUMN fee REAL NOT NULL DEFAULT 0;');
      } catch (e) {}
    }
  },
  {
    id: 7,
    name: 'add_savings_deposits_table',
    up: async (db) => {
      await db.execAsync(SAVINGS_DEPOSITS_TABLE);
    }
  },
  {
    id: 8,
    name: 'add_yield_pocket_settings_table',
    up: async (db) => {
      await db.execAsync(YIELD_POCKET_SETTINGS_TABLE);
    }
  },
  {
    id: 9,
    name: 'add_debt_and_lending_tables',
    up: async (db) => {
      await db.execAsync(PEOPLE_TABLE);
      await db.execAsync(DEBTS_TABLE);
      await db.execAsync(DEBT_PAYMENTS_TABLE);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_debts_person ON debts(personId);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debtId);');
    }
  },
  {
    id: 10,
    name: 'add_indexes_for_performance',
    up: async (db) => {
      for (const indexSql of ALL_INDEXES) {
        await db.execAsync(indexSql);
      }
    }
  },
  {
    id: 11,
    name: 'upgrade_yield_pockets_v2',
    up: async (db) => {
      // Check if columns exist first (idempotent setup just in case)
      try {
        await db.execAsync(`
          ALTER TABLE yield_pocket_settings ADD COLUMN interestBearingBalance REAL NOT NULL DEFAULT 0;
          ALTER TABLE yield_pocket_settings ADD COLUMN pendingDeposit REAL NOT NULL DEFAULT 0;
          ALTER TABLE yield_pocket_settings ADD COLUMN lastRolloverDate TEXT;
        `);
        // Backfill data for existing yield pockets
        await db.execAsync(`
          UPDATE yield_pocket_settings 
          SET interestBearingBalance = (SELECT balance FROM wallets WHERE wallets.id = yield_pocket_settings.walletId),
              lastRolloverDate = updatedAt;
        `);
      } catch (e: any) {
        // If column already exists, this throws. Safe to ignore.
        if (!e.message?.includes('duplicate column name')) {
          console.log('[Migration 11] Error adding columns (might already exist):', e.message);
        }
      }
    }
  },
  {
    id: 12,
    name: 'yield_pockets_smart_sync',
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE yield_pocket_settings ADD COLUMN yieldRule TEXT NOT NULL DEFAULT 'T1_FUND';
          ALTER TABLE yield_pocket_settings ADD COLUMN currentApy REAL NOT NULL DEFAULT 0;
          ALTER TABLE yield_pocket_settings ADD COLUMN lastSyncDate TEXT;
        `);
        // Backfill currentApy from annualYieldRate if it exists
        // SQLite doesn't let us drop columns easily, so we just ignore annualYieldRate from now on
        await db.execAsync(`
          UPDATE yield_pocket_settings 
          SET currentApy = annualYieldRate, yieldRule = 'T1_FUND', lastSyncDate = updatedAt;
        `);
      } catch (e: any) {
        if (!e.message?.includes('duplicate column name')) {
          console.log('[Migration 12] Error adding columns:', e.message);
        }
      }
    }
  },
  {
    id: 13,
    name: 'budgets_rework',
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS new_budgets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            targetType TEXT NOT NULL,
            targetId TEXT NOT NULL,
            recurrence TEXT NOT NULL,
            startDate TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );
          
          INSERT INTO new_budgets (id, name, amount, targetType, targetId, recurrence, startDate, createdAt, updatedAt)
          SELECT 
            b.id,
            IFNULL(c.name, 'Budget') as name,
            b.amount,
            'category' as targetType,
            b.categoryId as targetId,
            'monthly' as recurrence,
            printf('%04d-%02d-01T00:00:00.000Z', b.year, b.month) as startDate,
            b.createdAt,
            b.updatedAt
          FROM budgets b
          LEFT JOIN categories c ON b.categoryId = c.id;

          DROP TABLE budgets;
          ALTER TABLE new_budgets RENAME TO budgets;
        `);
      } catch (e: any) {
        console.log('[Migration 13] Error reworking budgets:', e.message);
      }
    }
  }
];

export const initDb = async () => {
  try {
    const db = await getDb();
    
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create migrations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executedAt TEXT NOT NULL
      );
    `);

    // Get applied migrations
    const appliedMigrations = await db.getAllAsync<{ id: number }>('SELECT id FROM migrations;');
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    // Run pending migrations
    for (const migration of MIGRATIONS) {
      if (!appliedIds.has(migration.id)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up(db);
        await db.runAsync('INSERT INTO migrations (id, name, executedAt) VALUES (?, ?, ?)', [
          migration.id,
          migration.name,
          new Date().toISOString()
        ]);
      }
    }
    
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const resetDb = async () => {
  try {
    const db = await getDb();
    const tables = [
      'debt_payments',
      'debts',
      'people',
      'yield_pocket_settings',
      'savings_deposits',
      'transaction_tags',
      'tags',
      'transaction_templates',
      'transactions',
      'budgets',
      'recurring_transactions',
      'savings_goals',
      'wallets',
      'categories',
      'app_settings',
      'migrations'
    ];

    // Disable foreign keys during drop
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }

    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Re-initialize
    await initDb();
    
    console.log('Database reset successfully.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
};
