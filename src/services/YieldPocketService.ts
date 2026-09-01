import { getDb } from '../database/db';
import { YieldPocketSettings, Wallet } from '../types';
import uuid from 'react-native-uuid';
import { WalletService } from './WalletService';
import { getSettlementDate } from '../utils/settlementDate';

/**
 * Maps a raw DB row to a typed YieldPocketSettings object.
 * Handles boolean coercion and null-safety for all fields.
 */
function mapRow(r: any): YieldPocketSettings {
  return {
    ...r,
    allowSpendingDirectly: Boolean(r.allowSpendingDirectly),
    minimumBalance: r.minimumBalance ?? 0,
    pendingSettlementDate: r.pendingSettlementDate ?? null,
    fractionalYieldCarry: r.fractionalYieldCarry ?? 0,
    // Existing rows from before migration 15 default to isQualified=1 (already earning)
    isQualified: r.isQualified == null ? true : Boolean(r.isQualified),
  };
}

export const YieldPocketService = {
  async getSettings(): Promise<YieldPocketSettings[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM yield_pocket_settings');
    return rows.map(mapRow);
  },

  async getSettingsForWallet(walletId: string): Promise<YieldPocketSettings | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<any>('SELECT * FROM yield_pocket_settings WHERE walletId = ?', walletId);
    if (!result) return null;
    return mapRow(result);
  },

  async saveSettings(settings: YieldPocketSettings): Promise<void> {
    const db = await getDb();
    const existing = await this.getSettingsForWallet(settings.walletId);
    if (existing) {
      await db.runAsync(
        `UPDATE yield_pocket_settings SET
          yieldRule = ?, currentApy = ?, yieldFrequency = ?, postingMode = ?,
          lastYieldCalculatedAt = ?, nextYieldDate = ?, allowSpendingDirectly = ?,
          interestBearingBalance = ?, pendingDeposit = ?, lastRolloverDate = ?,
          lastSyncDate = ?, minimumBalance = ?,
          pendingSettlementDate = ?, fractionalYieldCarry = ?, isQualified = ?,
          updatedAt = ?
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
        settings.minimumBalance ?? 0,
        settings.pendingSettlementDate ?? null,
        settings.fractionalYieldCarry ?? 0,
        settings.isQualified ? 1 : 0,
        settings.updatedAt,
        settings.walletId
      );
    } else {
      await db.runAsync(
        `INSERT INTO yield_pocket_settings (
          walletId, yieldRule, currentApy, yieldFrequency, postingMode,
          lastYieldCalculatedAt, nextYieldDate, allowSpendingDirectly,
          interestBearingBalance, pendingDeposit, lastRolloverDate, lastSyncDate,
          minimumBalance, pendingSettlementDate, fractionalYieldCarry, isQualified,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        settings.minimumBalance ?? 0,
        settings.pendingSettlementDate ?? null,
        settings.fractionalYieldCarry ?? 0,
        settings.isQualified ? 1 : 0,
        settings.createdAt,
        settings.updatedAt
      );
    }
  },

  /**
   * Called when money enters the pocket (income/transfer-in transaction).
   *
   * @param isYieldIncome - true when this deposit is auto-generated yield income.
   *   Yield income should NOT trigger threshold-crossing detection or reset the
   *   settlement window — it simply adds to pendingDeposit for normal T+1 settlement.
   */
  async onDeposit(walletId: string, amount: number, isYieldIncome = false): Promise<void> {
    const settings = await this.getSettingsForWallet(walletId);
    if (!settings) return;

    // T1_FUND: track the ledger explicitly
    if (settings.yieldRule === 'T1_FUND') {
      settings.pendingDeposit += amount;
    }
    // STANDARD: wallet.balance is used directly for yield; no pendingDeposit ledger needed.

    if (!isYieldIncome) {
      const minBalance = settings.minimumBalance ?? 0;

      if (minBalance > 0 && !settings.isQualified) {
        // Determine the new total (depends on rule)
        let newTotal: number;
        if (settings.yieldRule === 'T1_FUND') {
          // interestBearingBalance was moved to pendingDeposit on withdrawal (Option B),
          // so the full balance is in pendingDeposit now.
          newTotal = settings.pendingDeposit; // includes the amount we just added
        } else {
          // STANDARD: read wallet balance (already updated by WalletService before this call)
          const db = await getDb();
          const wallet = await db.getFirstAsync<{ balance: number }>('SELECT balance FROM wallets WHERE id = ?', walletId);
          newTotal = wallet?.balance ?? 0;
        }

        if (newTotal >= minBalance) {
          // Threshold crossed from below — Option B: full balance re-enters settlement.
          // For T1_FUND the entire pendingDeposit (= old IBB + old pending + new amount)
          // will settle together on the new settlement date.
          settings.pendingSettlementDate = getSettlementDate(new Date()).toISOString();
          settings.isQualified = true;
        }
        // If still below threshold, pendingSettlementDate stays null and isQualified stays false.
      } else if (settings.yieldRule === 'T1_FUND') {
        // Already qualified pocket receiving a new deposit: set/update settlement date.
        if (!settings.pendingSettlementDate) {
          settings.pendingSettlementDate = getSettlementDate(new Date()).toISOString();
        }
      }
    } else if (settings.yieldRule === 'T1_FUND') {
      // Yield income on a qualified pocket: settles normally with business-day calendar.
      if (!settings.pendingSettlementDate) {
        settings.pendingSettlementDate = getSettlementDate(new Date()).toISOString();
      }
    }

    settings.updatedAt = new Date().toISOString();
    await this.saveSettings(settings);
  },

  /**
   * Called when money leaves the pocket (expense/transfer-out transaction).
   *
   * Option B: if the withdrawal causes the balance to drop below minimumBalance,
   * the entire interestBearingBalance is moved back to pendingDeposit. The pocket
   * loses its qualified status and must go through settlement again when the user
   * deposits back above the threshold.
   */
  async onWithdraw(walletId: string, amount: number): Promise<void> {
    const settings = await this.getSettingsForWallet(walletId);
    if (!settings) return;

    const minBalance = settings.minimumBalance ?? 0;

    if (settings.yieldRule === 'T1_FUND') {
      if (amount > settings.pendingDeposit + settings.interestBearingBalance) {
        console.warn(`[YieldPocket] Withdrawal ${amount} exceeds pocket balance. Self-healing...`);
      }

      // Deduct from pendingDeposit first, then interestBearingBalance
      if (amount <= settings.pendingDeposit) {
        settings.pendingDeposit -= amount;
      } else {
        const remaining = amount - settings.pendingDeposit;
        settings.pendingDeposit = 0;
        settings.interestBearingBalance = Math.max(0, settings.interestBearingBalance - remaining);
      }

      // Option B: did we drop below the threshold?
      const newTotal = settings.interestBearingBalance + settings.pendingDeposit;
      if (settings.isQualified && minBalance > 0 && newTotal < minBalance) {
        // Move entire interestBearingBalance back into pendingDeposit.
        // The pocket is now "unqualified" — full re-settlement required when it comes back.
        settings.pendingDeposit += settings.interestBearingBalance;
        settings.interestBearingBalance = 0;
        settings.fractionalYieldCarry = 0; // discard carry; pocket is no longer earning
        settings.pendingSettlementDate = null; // will be set on re-qualification
        settings.isQualified = false;
      }
    } else if (settings.yieldRule === 'STANDARD') {
      // STANDARD: wallet.balance is already updated before this is called.
      if (settings.isQualified && minBalance > 0) {
        const db = await getDb();
        const wallet = await db.getFirstAsync<{ balance: number }>('SELECT balance FROM wallets WHERE id = ?', walletId);
        const currentBalance = wallet?.balance ?? 0;
        if (currentBalance < minBalance) {
          settings.isQualified = false;
          settings.pendingSettlementDate = null;
          settings.fractionalYieldCarry = 0;
        }
      }
    }

    settings.updatedAt = new Date().toISOString();
    await this.saveSettings(settings);
  },

  // ─── Yield Calculation Helpers ───────────────────────────────────────────────

  /** Legacy: returns floored yield (used for display estimates). */
  calculateDailyYield(balance: number, currentApy: number): number {
    return Math.floor((Math.max(0, balance) * (currentApy / 100)) / 365);
  },

  /** Legacy: returns floored yield (used for display estimates). */
  calculateMonthlyYield(balance: number, currentApy: number): number {
    return Math.floor((Math.max(0, balance) * (currentApy / 100)) / 12);
  },

  /**
   * Calculates daily yield including fractional carry from previous days.
   * Prevents sub-unit yield from being permanently discarded by Math.floor().
   * Returns the whole-unit amount to post and the new fractional carry.
   */
  calculateDailyYieldWithCarry(
    balance: number,
    currentApy: number,
    carry: number
  ): { yield: number; newCarry: number } {
    const raw = (Math.max(0, balance) * (currentApy / 100)) / 365 + carry;
    const posted = Math.floor(raw);
    return { yield: posted, newCarry: raw - posted };
  },

  /**
   * Calculates monthly yield including fractional carry from previous months.
   */
  calculateMonthlyYieldWithCarry(
    balance: number,
    currentApy: number,
    carry: number
  ): { yield: number; newCarry: number } {
    const raw = (Math.max(0, balance) * (currentApy / 100)) / 12 + carry;
    const posted = Math.floor(raw);
    return { yield: posted, newCarry: raw - posted };
  },

  // ─── Expected Yield (for display) ────────────────────────────────────────────

  async calculateExpectedYieldAmount(settings: YieldPocketSettings): Promise<number> {
    const db = await getDb();
    const wallet = await db.getFirstAsync<Wallet>('SELECT * FROM wallets WHERE id = ?', settings.walletId);
    if (!wallet) return 0;

    const balance = settings.yieldRule === 'T1_FUND' ? settings.interestBearingBalance : wallet.balance;
    if (balance <= 0) return 0;

    // Not yet qualified (below threshold)
    if (!settings.isQualified) return 0;

    // Still in settlement window — not earning yet
    if (settings.pendingSettlementDate && new Date(settings.pendingSettlementDate) > new Date()) return 0;

    // Minimum balance gate
    const minBalance = settings.minimumBalance ?? 0;
    if (minBalance > 0 && balance < minBalance) return 0;

    return settings.yieldFrequency === 'daily'
      ? this.calculateDailyYield(balance, settings.currentApy)
      : this.calculateMonthlyYield(balance, settings.currentApy);
  },

  // ─── Scheduling ──────────────────────────────────────────────────────────────

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

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

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
    console.log('baselineDate:', baselineDate, 'balance:', currentSettings.interestBearingBalance);
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
        const lastDayInterest = actualTotalInterest - pastDaysInterest;
        const inferredApy = (lastDayInterest * 365 / previousInterestBearingBalance) * 100;

        console.log('DEBUG APY:', { previousInterestBearingBalance, predictedTotalInterest, discrepancy, actualTotalInterest, lastDayInterest, inferredApy });

        if (inferredApy >= 0.5 && inferredApy <= 15.0) {
          currentSettings.currentApy = inferredApy;
        }
      }
    }

    currentSettings.lastSyncDate = syncDate.toISOString();
    await this.saveSettings(currentSettings);
  }
};
