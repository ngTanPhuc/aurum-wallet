import { getDb } from '../database/db';
import { YieldPocketSettings, Wallet } from '../types';
import uuid from 'react-native-uuid';
import { WalletService } from './WalletService';

export const YieldPocketService = {
  async getSettings(): Promise<YieldPocketSettings[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM yield_pocket_settings');
    return rows.map(r => ({ ...r, allowSpendingDirectly: Boolean(r.allowSpendingDirectly) }));
  },

  async getSettingsForWallet(walletId: string): Promise<YieldPocketSettings | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<any>('SELECT * FROM yield_pocket_settings WHERE walletId = ?', walletId);
    if (!result) return null;
    return { ...result, allowSpendingDirectly: Boolean(result.allowSpendingDirectly) };
  },

  async saveSettings(settings: YieldPocketSettings): Promise<void> {
    const db = await getDb();
    const existing = await this.getSettingsForWallet(settings.walletId);
    if (existing) {
      await db.runAsync(
        `UPDATE yield_pocket_settings SET
          yieldRule = ?, currentApy = ?, yieldFrequency = ?, postingMode = ?, lastYieldCalculatedAt = ?, nextYieldDate = ?, allowSpendingDirectly = ?, 
          interestBearingBalance = ?, pendingDeposit = ?, lastRolloverDate = ?, lastSyncDate = ?, updatedAt = ?
         WHERE walletId = ?`,
        settings.yieldRule,
        settings.currentApy,
        settings.yieldFrequency,
        settings.postingMode,
        settings.lastYieldCalculatedAt || null,
        settings.nextYieldDate || null,
        settings.allowSpendingDirectly ? 1 : 0,
        settings.interestBearingBalance,
        settings.pendingDeposit,
        settings.lastRolloverDate || null,
        settings.lastSyncDate || null,
        settings.updatedAt,
        settings.walletId
      );
    } else {
      await db.runAsync(
        `INSERT INTO yield_pocket_settings (walletId, yieldRule, currentApy, yieldFrequency, postingMode, lastYieldCalculatedAt, nextYieldDate, allowSpendingDirectly, interestBearingBalance, pendingDeposit, lastRolloverDate, lastSyncDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        settings.walletId,
        settings.yieldRule,
        settings.currentApy,
        settings.yieldFrequency,
        settings.postingMode,
        settings.lastYieldCalculatedAt || null,
        settings.nextYieldDate || null,
        settings.allowSpendingDirectly ? 1 : 0,
        settings.interestBearingBalance,
        settings.pendingDeposit,
        settings.lastRolloverDate || null,
        settings.lastSyncDate || null,
        settings.createdAt,
        settings.updatedAt
      );
    }
  },

  async onDeposit(walletId: string, amount: number): Promise<void> {
    const settings = await this.getSettingsForWallet(walletId);
    if (!settings) return;
    
    if (settings.yieldRule === 'T1_FUND') {
      settings.pendingDeposit += amount;
      settings.updatedAt = new Date().toISOString();
      await this.saveSettings(settings);
    }
  },

  async onWithdraw(walletId: string, amount: number): Promise<void> {
    const settings = await this.getSettingsForWallet(walletId);
    if (!settings) return;

    if (settings.yieldRule === 'T1_FUND') {
      if (amount > settings.pendingDeposit + settings.interestBearingBalance) {
        console.warn(`[YieldPocket] Withdrawal amount ${amount} exceeds pocket balance. Pocket is either out of sync or wallet is overdrawn. Self-healing...`);
      }

      if (amount <= settings.pendingDeposit) {
        settings.pendingDeposit -= amount;
      } else {
        const remaining = amount - settings.pendingDeposit;
        settings.pendingDeposit = 0;
        settings.interestBearingBalance -= remaining;
      }
      settings.updatedAt = new Date().toISOString();
      await this.saveSettings(settings);
    }
  },

  calculateDailyYield(balance: number, currentApy: number): number {
    return Math.floor((Math.max(0, balance) * (currentApy / 100)) / 365);
  },

  calculateMonthlyYield(balance: number, currentApy: number): number {
    return Math.floor((Math.max(0, balance) * (currentApy / 100)) / 12);
  },

  async calculateExpectedYieldAmount(settings: YieldPocketSettings): Promise<number> {
    const db = await getDb();
    const wallet = await db.getFirstAsync<Wallet>('SELECT * FROM wallets WHERE id = ?', settings.walletId);
    if (!wallet) return 0;
    
    const balance = settings.yieldRule === 'T1_FUND' ? settings.interestBearingBalance : wallet.balance;
    if (balance <= 0) return 0;

    return settings.yieldFrequency === 'daily' 
      ? this.calculateDailyYield(balance, settings.currentApy)
      : this.calculateMonthlyYield(balance, settings.currentApy);
  },

  isYieldDue(settings: YieldPocketSettings): boolean {
    if (!settings.nextYieldDate) return true;
    return new Date(settings.nextYieldDate).getTime() <= new Date().getTime();
  },

  async postYield(
    settings: YieldPocketSettings, 
    expectedYield: number, 
    addTransactionCb: (amount: number, dateStr: string) => Promise<void>
  ): Promise<void> {
    if (expectedYield <= 0) return;
    
    const dateStr = new Date().toISOString();
    await addTransactionCb(expectedYield, dateStr);

    if (settings.yieldRule === 'T1_FUND') {
      settings.interestBearingBalance += expectedYield;
    }
    
    settings.lastYieldCalculatedAt = dateStr;
    settings.nextYieldDate = this.getNextYieldDate(dateStr, settings.yieldFrequency);
    settings.updatedAt = dateStr;
    await this.saveSettings(settings);
  },

  getNextYieldDate(baseDateStr: string, frequency: 'daily' | 'monthly'): string {
    const date = new Date(baseDateStr);
    if (frequency === 'daily') {
      date.setDate(date.getDate() + 1);
    } else {
      const originalDay = date.getDate();
      const targetMonth = date.getMonth() + 1;
      const targetYear = targetMonth > 11 ? date.getFullYear() + 1 : date.getFullYear();
      const clampedTargetMonth = targetMonth > 11 ? 0 : targetMonth;
      const daysInTargetMonth = new Date(targetYear, clampedTargetMonth + 1, 0).getDate();
      const clampedDay = Math.min(originalDay, daysInTargetMonth);
      date.setFullYear(targetYear, clampedTargetMonth, clampedDay);
    }
    return date.toISOString();
  },

  async deleteSettings(walletId: string): Promise<void> {
    const db = await getDb();

    // Delete all yield-related transactions for this wallet — no trace left
    await db.runAsync(
      `DELETE FROM transactions
       WHERE sourceWalletId = ?
         AND note IN ('Yield earned', 'Manual Yield Collection', 'Smart Sync adjustment')`,
      walletId
    );

    // Delete the pocket settings row
    await db.runAsync('DELETE FROM yield_pocket_settings WHERE walletId = ?', walletId);
  },

  async syncActualBalance(
    walletId: string, 
    actualBalance: number, 
    syncDate: Date,
    addAdjustmentTransaction: (discrepancy: number) => Promise<void>
  ): Promise<void> {
    const settings = await this.getSettingsForWallet(walletId);
    if (!settings) return;

    const db = await getDb();
    const wallet = await db.getFirstAsync<Wallet>('SELECT * FROM wallets WHERE id = ?', walletId);
    if (!wallet) return;

    const discrepancy = actualBalance - wallet.balance;

    if (discrepancy !== 0) {
      await addAdjustmentTransaction(discrepancy);

      const freshSettings = await this.getSettingsForWallet(walletId);
      if (freshSettings && freshSettings.yieldRule === 'T1_FUND') {
        if (discrepancy > 0) {
          freshSettings.pendingDeposit -= discrepancy;
          freshSettings.interestBearingBalance += discrepancy;
          await this.saveSettings(freshSettings);
        }
      }
    }

    const currentSettings = await this.getSettingsForWallet(walletId);
    if (!currentSettings) return;

    const baselineDate = currentSettings.lastSyncDate || currentSettings.createdAt;
    console.log("baselineDate:", baselineDate, "balance:", currentSettings.interestBearingBalance);
    if (baselineDate && currentSettings.interestBearingBalance > 0) {
      const lastSync = new Date(baselineDate);
      const daysElapsed = (syncDate.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysElapsed >= 1) {
        let previousInterestBearingBalance = currentSettings.interestBearingBalance;
        if (currentSettings.yieldRule === 'T1_FUND' && discrepancy > 0) {
           previousInterestBearingBalance -= discrepancy;
        }

        let predictedTotalInterest = 0;
        let pastDaysInterest = 0;
        
        if (currentSettings.yieldFrequency === 'daily') {
           const dailyYield = this.calculateDailyYield(previousInterestBearingBalance, currentSettings.currentApy);
           predictedTotalInterest = dailyYield * Math.floor(daysElapsed);
           pastDaysInterest = dailyYield * (Math.floor(daysElapsed) - 1);
        } else {
           const monthlyYield = this.calculateMonthlyYield(previousInterestBearingBalance, currentSettings.currentApy);
           predictedTotalInterest = monthlyYield * (Math.floor(daysElapsed) / 30);
           pastDaysInterest = monthlyYield * ((Math.floor(daysElapsed) - 1) / 30);
        }

        const actualTotalInterest = predictedTotalInterest + discrepancy;
        
        // Attribute all discrepancy to the most recent day to catch daily APY fluctuations
        const lastDayInterest = actualTotalInterest - pastDaysInterest;
        const inferredApy = (lastDayInterest * 365 / previousInterestBearingBalance) * 100;

        console.log("DEBUG APY:", { previousInterestBearingBalance, predictedTotalInterest, discrepancy, actualTotalInterest, lastDayInterest, inferredApy });

        if (inferredApy >= 0.5 && inferredApy <= 15.0) {
          currentSettings.currentApy = inferredApy;
        }
      }
    }

    currentSettings.lastSyncDate = syncDate.toISOString();
    await this.saveSettings(currentSettings);
  }
};
