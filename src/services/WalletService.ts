import { getDb } from '../database/db';
import { Wallet } from '../types';

export const WalletService = {
  async getWallets(): Promise<Wallet[]> {
    const db = await getDb();
    const wallets = await db.getAllAsync<any>('SELECT * FROM wallets ORDER BY createdAt DESC');
    return wallets.map(w => ({
      ...w,
      includeInTotal: w.includeInTotal === 1,
      isArchived: w.isArchived === 1
    }));
  },

  async getWalletById(id: string): Promise<Wallet | null> {
    const db = await getDb();
    const w = await db.getFirstAsync<any>('SELECT * FROM wallets WHERE id = ?', id);
    if (!w) return null;
    return {
      ...w,
      includeInTotal: w.includeInTotal === 1,
      isArchived: w.isArchived === 1
    };
  },

  async addWallet(wallet: Wallet): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, balance, initialBalance, currency, color, icon, includeInTotal, isArchived, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      wallet.id,
      wallet.name,
      wallet.type,
      wallet.balance,
      wallet.initialBalance,
      wallet.currency,
      wallet.color || '',
      wallet.icon || '',
      wallet.includeInTotal ? 1 : 0,
      wallet.isArchived ? 1 : 0,
      wallet.createdAt,
      wallet.updatedAt
    );
  },

  async updateWallet(wallet: Wallet): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE wallets SET 
        name = ?, type = ?, balance = ?, initialBalance = ?, currency = ?, color = ?, icon = ?, includeInTotal = ?, isArchived = ?, updatedAt = ?
       WHERE id = ?`,
      wallet.name,
      wallet.type,
      wallet.balance,
      wallet.initialBalance,
      wallet.currency,
      wallet.color || '',
      wallet.icon || '',
      wallet.includeInTotal ? 1 : 0,
      wallet.isArchived ? 1 : 0,
      wallet.updatedAt,
      wallet.id
    );
  },

  async deleteWallet(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM wallets WHERE id = ?', id);
  },

  async updateWalletBalance(id: string, amountChange: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE wallets SET balance = balance + ?, updatedAt = ? WHERE id = ?`,
      amountChange,
      new Date().toISOString(),
      id
    );
  },

  async archiveWalletWithDependencies(id: string, resolutions: {
    cancelRecurring: boolean;
    stopYieldPocket: boolean;
    unlinkGoals: boolean;
  }): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'UPDATE wallets SET isArchived = 1, includeInTotal = 0, updatedAt = ? WHERE id = ?',
        now, id
      );
      
      if (resolutions.cancelRecurring) {
        await txn.runAsync(
          'UPDATE recurring_transactions SET isActive = 0, updatedAt = ? WHERE walletId = ? OR destinationWalletId = ?',
          now, id, id
        );
      }
      
      if (resolutions.stopYieldPocket) {
        await txn.runAsync('DELETE FROM yield_pocket_settings WHERE walletId = ?', id);
      }
      
      if (resolutions.unlinkGoals) {
        await txn.runAsync(
          'UPDATE savings_goals SET linkedWalletId = NULL, updatedAt = ? WHERE linkedWalletId = ?',
          now, id
        );
      }
    });
  },

  async unarchiveWallet(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE wallets SET isArchived = 0, includeInTotal = 1, updatedAt = ? WHERE id = ?',
      new Date().toISOString(), id
    );
  }
};
