import { getDb } from '../database/db';
import { Transaction } from '../types';
import { WalletService } from './WalletService';
import { SavingsGoalService } from './SavingsGoalService';
import { YieldPocketService } from './YieldPocketService';

export const TransactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const db = await getDb();
    const txs = await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY transactionDate DESC, createdAt DESC');
    
    // Load tags
    const ttRows = await db.getAllAsync<{transactionId: string, id: string, name: string, color: string, createdAt: string}>(
      `SELECT tt.transactionId, t.* FROM tags t INNER JOIN transaction_tags tt ON t.id = tt.tagId`
    );
    
    const tagsByTxId: Record<string, any[]> = {};
    for (const row of ttRows) {
      if (!tagsByTxId[row.transactionId]) tagsByTxId[row.transactionId] = [];
      tagsByTxId[row.transactionId].push({ id: row.id, name: row.name, color: row.color, createdAt: row.createdAt });
    }

    for (const tx of txs) {
      tx.tags = tagsByTxId[tx.id] || [];
    }

    return txs;
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', id);
    if (!result) return null;

    const tags = await db.getAllAsync<any>(
      `SELECT t.* FROM tags t INNER JOIN transaction_tags tt ON t.id = tt.tagId WHERE tt.transactionId = ?`, 
      [id]
    );
    result.tags = tags;
    return result;
  },

  async addTransaction(tx: Transaction): Promise<void> {
    const db = await getDb();
    
    await db.withExclusiveTransactionAsync(async () => {
      const args = [
        tx.id,
        tx.type,
        tx.amount,
        tx.fee || 0,
        tx.sourceWalletId,
        tx.destinationWalletId || null,
        tx.categoryId || null,
        tx.savingsGoalId || null,
        tx.note || '',
        tx.transactionDate,
        tx.createdAt,
        tx.updatedAt
      ];
      console.log('[DEBUG_SQL_INSERT] args:', args);
      try {
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, fee, sourceWalletId, destinationWalletId, categoryId, savingsGoalId, note, transactionDate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args
        );
      } catch (insertErr) {
        console.error('[DEBUG_SQL_INSERT_ERROR]', insertErr);
        throw insertErr;
      }

      // Save tags if any
      if (tx.tags && tx.tags.length > 0) {
        for (const tag of tx.tags) {
          console.log('[DEBUG_SQL_TAG_INSERT] inserting tag:', tag.id, 'for tx:', tx.id);
          try {
            await db.runAsync('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', [tx.id, tag.id]);
          } catch (tagErr) {
            console.error('[DEBUG_SQL_TAG_INSERT_ERROR]', tagErr);
            throw tagErr;
          }
        }
      }

      // Apply effect
      await this.applyTransactionEffect(tx);
    });
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const db = await getDb();
    
    await db.withExclusiveTransactionAsync(async () => {
      // Reverse old effect
      const oldTx = await this.getTransactionById(tx.id);
      if (oldTx) {
        await this.reverseTransactionEffect(oldTx);
      }

      await db.runAsync(
        `UPDATE transactions SET 
          type = ?, amount = ?, fee = ?, sourceWalletId = ?, 
          destinationWalletId = ?, categoryId = ?, savingsGoalId = ?, 
          note = ?, transactionDate = ?, updatedAt = ?
         WHERE id = ?`,
        [
          tx.type,
          tx.amount,
          tx.fee || 0,
          tx.sourceWalletId,
          tx.destinationWalletId || null,
          tx.categoryId || null,
          tx.savingsGoalId || null,
          tx.note || '',
          tx.transactionDate,
          tx.updatedAt,
          tx.id
        ]
      );

      // Update tags
      await db.runAsync('DELETE FROM transaction_tags WHERE transactionId = ?', [tx.id]);
      if (tx.tags && tx.tags.length > 0) {
        for (const tag of tx.tags) {
          await db.runAsync('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', [tx.id, tag.id]);
        }
      }

      // Apply new effect
      await this.applyTransactionEffect(tx);
    });
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = await getDb();
    
    await db.withExclusiveTransactionAsync(async () => {
      const oldTx = await this.getTransactionById(id);
      if (oldTx) {
        await this.reverseTransactionEffect(oldTx);
      }
      await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
    });
  },

  async applyTransactionEffect(tx: Transaction): Promise<void> {
    const fee = tx.fee || 0;
    // Savings deposit/payout transactions should not affect the yield pocket ledger.
    // The funds are being locked into a fixed-term product, not spent or earned freely.
    const isSavingsDepositOp = tx.note?.startsWith('Deposit to savings:') || 
                               tx.note?.startsWith('Maturity payout:') || 
                               tx.note?.startsWith('Early closure payout:');

    if (tx.type === 'expense') {
      const totalAmount = tx.amount + fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, -totalAmount);
      if (!isSavingsDepositOp) {
        await YieldPocketService.onWithdraw(tx.sourceWalletId, totalAmount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'income') {
      const netAmount = tx.amount - fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, netAmount);
      if (!isSavingsDepositOp) {
        // Yield income must not trigger threshold-crossing re-qualification.
        const isYieldIncome = tx.note === 'Yield earned' || tx.note === 'Manual Yield Collection';
        await YieldPocketService.onDeposit(tx.sourceWalletId, netAmount, isYieldIncome);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'transfer') {
      const totalAmount = tx.amount + fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, -totalAmount);
      await YieldPocketService.onWithdraw(tx.sourceWalletId, totalAmount);
      if (tx.destinationWalletId) {
        await WalletService.updateWalletBalance(tx.destinationWalletId, tx.amount);
        await YieldPocketService.onDeposit(tx.destinationWalletId, tx.amount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'adjustment') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, tx.amount);
      if (tx.amount > 0) {
        await YieldPocketService.onDeposit(tx.sourceWalletId, tx.amount);
      } else if (tx.amount < 0) {
        await YieldPocketService.onWithdraw(tx.sourceWalletId, Math.abs(tx.amount));
      }
    }
  },

  async reverseTransactionEffect(tx: Transaction): Promise<void> {
    const fee = tx.fee || 0;
    const isSavingsDepositOp = tx.note?.startsWith('Deposit to savings:') || 
                               tx.note?.startsWith('Maturity payout:') || 
                               tx.note?.startsWith('Early closure payout:');

    if (tx.type === 'expense') {
      const totalAmount = tx.amount + fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, totalAmount);
      if (!isSavingsDepositOp) {
        await YieldPocketService.onDeposit(tx.sourceWalletId, totalAmount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'income') {
      const netAmount = tx.amount - fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, -netAmount);
      if (!isSavingsDepositOp) {
        await YieldPocketService.onWithdraw(tx.sourceWalletId, netAmount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'transfer') {
      const totalAmount = tx.amount + fee;
      await WalletService.updateWalletBalance(tx.sourceWalletId, totalAmount);
      await YieldPocketService.onDeposit(tx.sourceWalletId, totalAmount);
      if (tx.destinationWalletId) {
        await WalletService.updateWalletBalance(tx.destinationWalletId, -tx.amount);
        await YieldPocketService.onWithdraw(tx.destinationWalletId, tx.amount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'adjustment') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, -tx.amount);
      if (tx.amount > 0) {
        await YieldPocketService.onWithdraw(tx.sourceWalletId, tx.amount);
      } else if (tx.amount < 0) {
        await YieldPocketService.onDeposit(tx.sourceWalletId, Math.abs(tx.amount));
      }
    }
  }
};
