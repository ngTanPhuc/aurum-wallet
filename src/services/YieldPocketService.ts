import { getDb } from '../database/db';
import { YieldPocketSettings, Wallet } from '../types';
import uuid from 'react-native-uuid';
import { TransactionService } from './TransactionService';
import { WalletService } from './WalletService';

export const YieldPocketService = {
  async getSettings(): Promise<YieldPocketSettings[]> {
    const db = await getDb();
    return await db.getAllAsync<YieldPocketSettings>('SELECT * FROM yield_pocket_settings');
  },

  async getSettingsForWallet(walletId: string): Promise<YieldPocketSettings | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<YieldPocketSettings>('SELECT * FROM yield_pocket_settings WHERE walletId = ?', walletId);
    return result || null;
  },

  async saveSettings(settings: YieldPocketSettings): Promise<void> {
    const db = await getDb();
    const existing = await this.getSettingsForWallet(settings.walletId);
    if (existing) {
      await db.runAsync(
        `UPDATE yield_pocket_settings SET
          annualYieldRate = ?, yieldFrequency = ?, postingMode = ?, lastYieldCalculatedAt = ?, nextYieldDate = ?, allowSpendingDirectly = ?, updatedAt = ?
         WHERE walletId = ?`,
        settings.annualYieldRate,
        settings.yieldFrequency,
        settings.postingMode,
        settings.lastYieldCalculatedAt || null,
        settings.nextYieldDate || null,
        settings.allowSpendingDirectly ? 1 : 0,
        settings.updatedAt,
        settings.walletId
      );
    } else {
      await db.runAsync(
        `INSERT INTO yield_pocket_settings (walletId, annualYieldRate, yieldFrequency, postingMode, lastYieldCalculatedAt, nextYieldDate, allowSpendingDirectly, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        settings.walletId,
        settings.annualYieldRate,
        settings.yieldFrequency,
        settings.postingMode,
        settings.lastYieldCalculatedAt || null,
        settings.nextYieldDate || null,
        settings.allowSpendingDirectly ? 1 : 0,
        settings.createdAt,
        settings.updatedAt
      );
    }
  },

  calculateDailyYield(balance: number, annualYieldRate: number): number {
    return (balance * (annualYieldRate / 100)) / 365;
  },

  calculateMonthlyYield(balance: number, annualYieldRate: number): number {
    return (balance * (annualYieldRate / 100)) / 12;
  },

  getNextYieldDate(lastDateStr: string | undefined, frequency: 'daily' | 'monthly', creationDateStr: string): string {
    const baseDateStr = lastDateStr || creationDateStr;
    const date = new Date(baseDateStr);
    
    if (frequency === 'daily') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString();
  },

  isYieldDue(settings: YieldPocketSettings): boolean {
    if (!settings.nextYieldDate) {
      return true; // Due immediately if no next yield date is set but it should be based on creation date
    }
    const now = new Date().getTime();
    const next = new Date(settings.nextYieldDate).getTime();
    return now >= next;
  },

  async calculateExpectedYieldAmount(settings: YieldPocketSettings): Promise<number> {
    const wallets = await WalletService.getWallets();
    const wallet = wallets.find(w => w.id === settings.walletId);
    if (!wallet) return 0;

    let balance = wallet.balance;
    if (settings.yieldFrequency === 'daily') {
      return this.calculateDailyYield(balance, settings.annualYieldRate);
    } else {
      return this.calculateMonthlyYield(balance, settings.annualYieldRate);
    }
  },

  async postYield(settings: YieldPocketSettings, amount: number, interestCategoryId?: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Add income transaction
    await TransactionService.addTransaction({
      id: uuid.v4() as string,
      type: 'income',
      amount: amount,
      sourceWalletId: settings.walletId,
      categoryId: interestCategoryId,
      note: 'Estimated yield earned',
      transactionDate: now,
      createdAt: now,
      updatedAt: now
    });

    // Update settings
    settings.lastYieldCalculatedAt = now;
    settings.nextYieldDate = this.getNextYieldDate(now, settings.yieldFrequency, settings.createdAt);
    settings.updatedAt = now;
    
    await this.saveSettings(settings);
  }
};
