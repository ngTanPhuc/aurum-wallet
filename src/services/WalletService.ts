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
  }
};
