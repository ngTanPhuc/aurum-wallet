import { getDb } from '../database/db';
import { RecurringTransaction, Transaction } from '../types';
import uuid from 'react-native-uuid';
import { TransactionService } from './TransactionService';

export class RecurringTransactionService {
  static async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM recurring_transactions ORDER BY nextDueDate ASC;');
    return rows.map(row => ({
      ...row,
      isActive: row.isActive === 1,
      isSubscription: row.isSubscription === 1
    }));
  }

  static async addRecurringTransaction(rt: RecurringTransaction): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO recurring_transactions (
        id, name, type, amount, fee, walletId, destinationWalletId, categoryId, note, 
        frequency, startDate, nextDueDate, isActive, isSubscription, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rt.id, rt.name, rt.type, rt.amount, rt.fee || 0, rt.walletId, rt.destinationWalletId || null, 
        rt.categoryId || null, rt.note, rt.frequency, rt.startDate, 
        rt.nextDueDate, rt.isActive ? 1 : 0, rt.isSubscription ? 1 : 0, rt.createdAt, rt.updatedAt
      ]
    );
  }

  static async updateRecurringTransaction(rt: RecurringTransaction): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE recurring_transactions SET 
        name = ?, type = ?, amount = ?, fee = ?, walletId = ?, destinationWalletId = ?, categoryId = ?, note = ?, 
        frequency = ?, startDate = ?, nextDueDate = ?, isActive = ?, isSubscription = ?, updatedAt = ?
       WHERE id = ?`,
      [
        rt.name, rt.type, rt.amount, rt.fee || 0, rt.walletId, rt.destinationWalletId || null, rt.categoryId || null, 
        rt.note, rt.frequency, rt.startDate, rt.nextDueDate, rt.isActive ? 1 : 0, 
        rt.isSubscription ? 1 : 0, rt.updatedAt, rt.id
      ]
    );
  }

  static async deleteRecurringTransaction(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?;', [id]);
  }

  // Gets transactions that are active and their nextDueDate is <= now
  static async getPendingTransactions(): Promise<RecurringTransaction[]> {
    const db = await getDb();
    const now = new Date().toISOString();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM recurring_transactions WHERE isActive = 1 AND nextDueDate <= ? ORDER BY nextDueDate ASC;',
      [now]
    );
    return rows.map(row => ({
      ...row,
      isActive: row.isActive === 1,
      isSubscription: row.isSubscription === 1
    }));
  }

  static calculateNextDueDate(currentDueDate: string, frequency: string): string {
    const date = new Date(currentDueDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly': {
        const currentMonth = date.getMonth();
        date.setMonth(currentMonth + 1);
        if (date.getMonth() !== (currentMonth + 1) % 12) {
          date.setDate(0);
        }
        break;
      }
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString();
  }

  static async skipPendingTransaction(rt: RecurringTransaction): Promise<RecurringTransaction> {
    const nextDate = this.calculateNextDueDate(rt.nextDueDate, rt.frequency);
    const updated = {
      ...rt,
      nextDueDate: nextDate,
      updatedAt: new Date().toISOString()
    };
    await this.updateRecurringTransaction(updated);
    return updated;
  }

  static async confirmPendingTransaction(
    rt: RecurringTransaction,
    editedTransactionData?: Partial<Transaction>
  ): Promise<{ transaction: Transaction; updatedRecurring: RecurringTransaction }> {
    const db = await getDb();
    
    const txData: Transaction = {
      id: uuid.v4() as string,
      type: editedTransactionData?.type || rt.type,
      amount: editedTransactionData?.amount ?? rt.amount,
      fee: editedTransactionData?.fee ?? rt.fee ?? 0,
      sourceWalletId: editedTransactionData?.sourceWalletId || rt.walletId,
      destinationWalletId: editedTransactionData?.destinationWalletId || rt.destinationWalletId,
      categoryId: editedTransactionData?.categoryId || rt.categoryId,
      note: editedTransactionData?.note !== undefined ? editedTransactionData.note : rt.note,
      transactionDate: rt.nextDueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Execute the actual transaction (updates wallet balances)
    await TransactionService.addTransaction(txData);

    // Update the recurring template to the next due date
    const updatedRecurring = await this.skipPendingTransaction(rt);

    return { transaction: txData, updatedRecurring };
  }
}
