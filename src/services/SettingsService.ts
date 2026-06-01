import { getDb } from '../database/db';

export const SettingsService = {
  async getSetting(key: string): Promise<string | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key
    );
    return result ? result.value : null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      key, value
    );
  },

  async isFirstRun(): Promise<boolean> {
    const value = await this.getSetting('isFirstRun');
    return value === null || value === 'true';
  },

  async setFirstRunCompleted(): Promise<void> {
    await this.setSetting('isFirstRun', 'false');
  },

  async getDefaultCurrency(): Promise<string> {
    const value = await this.getSetting('defaultCurrency');
    return value || 'VND';
  },

  async setDefaultCurrency(currency: string): Promise<void> {
    await this.setSetting('defaultCurrency', currency);
  },

  async wipeAllData(): Promise<void> {
    const db = await getDb();
    // Execute deletions in order to avoid foreign key constraint issues
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM recurring_transactions;
      DELETE FROM savings_goals;
      DELETE FROM wallets;
      DELETE FROM categories;
    `);
    
    // Optionally reset first run flag
    await this.setSetting('isFirstRun', 'true');
  }
};
