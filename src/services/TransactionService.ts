import { getDb } from '../database/db';
import { Transaction } from '../types';
import { WalletService } from './WalletService';
import { SavingsGoalService } from './SavingsGoalService';

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
    
    await db.execAsync('BEGIN EXCLUSIVE TRANSACTION');
    try {
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, fee, sourceWalletId, destinationWalletId, categoryId, savingsGoalId, note, transactionDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ${tx.destinationWalletId ? '?' : 'NULL'}, ${tx.categoryId ? '?' : 'NULL'}, ${tx.savingsGoalId ? '?' : 'NULL'}, ?, ?, ?, ?)`,
        tx.id,
        tx.type,
        tx.amount,
        tx.fee || 0,
        tx.sourceWalletId,
        ...(tx.destinationWalletId ? [tx.destinationWalletId] : []),
        ...(tx.categoryId ? [tx.categoryId] : []),
        ...(tx.savingsGoalId ? [tx.savingsGoalId] : []),
        tx.note || '',
        tx.transactionDate,
        tx.createdAt,
        tx.updatedAt
      );

      // Save tags if any
      if (tx.tags && tx.tags.length > 0) {
        for (const tag of tx.tags) {
          await db.runAsync('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', [tx.id, tag.id]);
        }
      }

      // Apply effect
      await this.applyTransactionEffect(tx);
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const db = await getDb();
    
    await db.execAsync('BEGIN EXCLUSIVE TRANSACTION');
    try {
      // Reverse old effect
      const oldTx = await this.getTransactionById(tx.id);
      if (oldTx) {
        await this.reverseTransactionEffect(oldTx);
      }

      await db.runAsync(
        `UPDATE transactions SET 
          type = ?, amount = ?, fee = ?, sourceWalletId = ?, 
          destinationWalletId = ${tx.destinationWalletId ? '?' : 'NULL'}, 
          categoryId = ${tx.categoryId ? '?' : 'NULL'}, 
          savingsGoalId = ${tx.savingsGoalId ? '?' : 'NULL'}, 
          note = ?, transactionDate = ?, updatedAt = ?
         WHERE id = ?`,
        tx.type,
        tx.amount,
        tx.fee || 0,
        tx.sourceWalletId,
        ...(tx.destinationWalletId ? [tx.destinationWalletId] : []),
        ...(tx.categoryId ? [tx.categoryId] : []),
        ...(tx.savingsGoalId ? [tx.savingsGoalId] : []),
        tx.note || '',
        tx.transactionDate,
        tx.updatedAt,
        tx.id
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
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = await getDb();
    
    await db.execAsync('BEGIN EXCLUSIVE TRANSACTION');
    try {
      const oldTx = await this.getTransactionById(id);
      if (oldTx) {
        await this.reverseTransactionEffect(oldTx);
      }
      await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  },

  async applyTransactionEffect(tx: Transaction): Promise<void> {
    const fee = tx.fee || 0;
    if (tx.type === 'expense') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, -(tx.amount + fee));
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'income') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, tx.amount - fee);
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'transfer') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, -(tx.amount + fee));
      if (tx.destinationWalletId) {
        await WalletService.updateWalletBalance(tx.destinationWalletId, tx.amount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'adjustment') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, tx.amount); // adjustment amount should be the diff
    }
  },

  async reverseTransactionEffect(tx: Transaction): Promise<void> {
    const fee = tx.fee || 0;
    if (tx.type === 'expense') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, tx.amount + fee);
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'income') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, -(tx.amount - fee));
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, tx.amount);
      }
    } else if (tx.type === 'transfer') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, tx.amount + fee);
      if (tx.destinationWalletId) {
        await WalletService.updateWalletBalance(tx.destinationWalletId, -tx.amount);
      }
      if (tx.savingsGoalId) {
        await SavingsGoalService.updateSavingsGoalAmount(tx.savingsGoalId, -tx.amount);
      }
    } else if (tx.type === 'adjustment') {
      await WalletService.updateWalletBalance(tx.sourceWalletId, -tx.amount);
    }
  }
};
