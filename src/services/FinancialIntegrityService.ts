import { getDb } from '../database/db';
import { Wallet, Transaction } from '../types';
import { WalletService } from './WalletService';

export interface IntegrityReport {
  isHealthy: boolean;
  issuesCount: number;
  details: string[];
  discrepancies: {
    walletId: string;
    walletName: string;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
  }[];
}

export class FinancialIntegrityService {
  /**
   * Scans all transactions and recalculates the expected balance for each wallet.
   * Compares the expected balance with the current wallet.balance.
   */
  static async detectInconsistencies(): Promise<IntegrityReport> {
    const db = await getDb();
    
    // Fetch all wallets
    const wallets = await WalletService.getWallets();
    const walletsMap = new Map(wallets.map(w => [w.id, w]));
    
    // Fetch all transactions
    const rows = await db.getAllAsync<any>('SELECT * FROM transactions;');
    
    // Calculate expected balances
    const expectedBalances = new Map<string, number>();
    wallets.forEach(w => expectedBalances.set(w.id, w.initialBalance));

    rows.forEach(t => {
      const { type, amount, sourceWalletId, destinationWalletId } = t;
      const fee = t.fee || 0;
      
      // Update source wallet
      if (expectedBalances.has(sourceWalletId)) {
        let balance = expectedBalances.get(sourceWalletId)!;
        if (type === 'income') {
          balance += (amount - fee);
        } else if (type === 'expense') {
          balance -= (amount + fee);
        } else if (type === 'transfer') {
          balance -= (amount + fee);
        } else if (type === 'adjustment') {
          balance += amount;
        }
        expectedBalances.set(sourceWalletId, balance);
      }

      // Update destination wallet for transfers
      if (type === 'transfer' && destinationWalletId && expectedBalances.has(destinationWalletId)) {
        let destBalance = expectedBalances.get(destinationWalletId)!;
        destBalance += amount;
        expectedBalances.set(destinationWalletId, destBalance);
      }
    });

    // Compare with actual balances
    const report: IntegrityReport = {
      isHealthy: true,
      issuesCount: 0,
      details: [],
      discrepancies: []
    };

    wallets.forEach(w => {
      // Avoid floating point precision issues by rounding to 2 decimal places
      const expected = Math.round((expectedBalances.get(w.id) || 0) * 100) / 100;
      const actual = Math.round(w.balance * 100) / 100;
      
      if (Math.abs(expected - actual) > 0.01) {
        report.isHealthy = false;
        report.issuesCount++;
        const difference = actual - expected;
        report.discrepancies.push({
          walletId: w.id,
          walletName: w.name,
          expectedBalance: expected,
          actualBalance: actual,
          difference: difference
        });
        report.details.push(`Wallet "${w.name}" has a discrepancy. Expected: ${expected}, Actual: ${actual} (Diff: ${difference})`);
      }
    });

    if (report.isHealthy) {
      report.details.push('All wallet balances match their transaction history perfectly.');
    }

    return report;
  }

  /**
   * Forces the wallet balances in the database to match their expected balances 
   * based on immutable transaction history.
   */
  static async repairBalances(discrepancies: IntegrityReport['discrepancies']): Promise<void> {
    const db = await getDb();
    for (const d of discrepancies) {
      await db.runAsync(
        'UPDATE wallets SET balance = ?, updatedAt = ? WHERE id = ?',
        d.expectedBalance,
        new Date().toISOString(),
        d.walletId
      );
    }
  }
}
