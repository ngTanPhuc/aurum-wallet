import * as SQLite from 'expo-sqlite';
import { ALL_SCHEMAS_V1, TRANSACTION_TEMPLATES_TABLE, TAGS_TABLE, TRANSACTION_TAGS_TABLE } from './schema';

export const DATABASE_NAME = 'aurum_v1.db';

let _dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (!_dbInstance) {
    _dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
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
