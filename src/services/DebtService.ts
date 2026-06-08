import { getDb } from '../database/db';
import { Debt, DebtPayment, Transaction } from '../types';

export const DebtService = {
  // Interest Calculations
  calculateDebtInterest(principal: number, rate: number, type: 'none' | 'flat' | 'simple_annual', startDate: string, dueDate?: string): number {
    if (type === 'none' || rate === 0) return 0;
    if (type === 'flat') {
      return (principal * rate) / 100;
    }
    if (type === 'simple_annual') {
      const start = new Date(startDate);
      const due = dueDate ? new Date(dueDate) : new Date(); // If no due date, calculate expected up to today
      const diffTime = Math.abs(due.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return (principal * rate * diffDays) / (100 * 365);
    }
    return 0;
  },

  calculateTotalExpectedAmount(principal: number, interestAmount: number): number {
    return principal + interestAmount;
  },

  calculateRemainingAmount(totalExpected: number, amountPaid: number): number {
    return Math.max(0, totalExpected - amountPaid);
  },

  isDebtOverdue(debt: Debt): boolean {
    if (debt.status === 'paid' || debt.status === 'cancelled') return false;
    if (!debt.dueDate) return false;
    const due = new Date(debt.dueDate);
    const now = new Date();
    // Reset time for fair date comparison
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return now > due && debt.remainingAmount > 0;
  },

  getDebtStatus(remainingAmount: number, amountPaid: number, totalExpected: number, dueDate?: string): 'active' | 'partially_paid' | 'paid' | 'overdue' {
    if (remainingAmount <= 0 || amountPaid >= totalExpected) return 'paid';
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      due.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (now > due) return 'overdue';
    }
    if (amountPaid > 0) return 'partially_paid';
    return 'active';
  },

  // DB CRUD
  async getDebts(): Promise<Debt[]> {
    const db = await getDb();
    return await db.getAllAsync<Debt>('SELECT * FROM debts ORDER BY createdAt DESC');
  },

  async getDebtPayments(): Promise<DebtPayment[]> {
    const db = await getDb();
    return await db.getAllAsync<DebtPayment>('SELECT * FROM debt_payments ORDER BY paymentDate DESC');
  },

  async createDebtWithTransaction(debt: Debt, transaction: Transaction): Promise<void> {
    const db = await getDb();
    await db.execAsync('BEGIN EXCLUSIVE TRANSACTION');
    try {
      // 1. Insert Transaction
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, fee, sourceWalletId, destinationWalletId, categoryId, note, transactionDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.type,
        transaction.amount,
        transaction.fee || 0,
        transaction.sourceWalletId,
        transaction.destinationWalletId || null,
        transaction.categoryId || null,
        transaction.note || null,
        transaction.transactionDate,
        transaction.createdAt,
        transaction.updatedAt
      );

      // 2. Adjust Wallet Balance
      if (transaction.type === 'expense') {
        await db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updatedAt = ? WHERE id = ?',
          transaction.amount + (transaction.fee || 0),
          transaction.updatedAt,
          transaction.sourceWalletId
        );
      } else if (transaction.type === 'income') {
        await db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updatedAt = ? WHERE id = ?',
          transaction.amount,
          transaction.updatedAt,
          transaction.sourceWalletId
        );
      }

      // 3. Insert Debt
      await db.runAsync(
        `INSERT INTO debts (id, personId, direction, principalAmount, interestType, interestRate, interestAmount, totalExpectedAmount, amountPaid, remainingAmount, walletId, categoryId, startDate, dueDate, status, note, openingTransactionId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        debt.id,
        debt.personId,
        debt.direction,
        debt.principalAmount,
        debt.interestType,
        debt.interestRate,
        debt.interestAmount,
        debt.totalExpectedAmount,
        debt.amountPaid,
        debt.remainingAmount,
        debt.walletId,
        debt.categoryId || null,
        debt.startDate,
        debt.dueDate || null,
        debt.status,
        debt.note || null,
        debt.openingTransactionId,
        debt.createdAt,
        debt.updatedAt
      );

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  },

  async recordDebtPayment(debtPayment: DebtPayment, transaction: Transaction, updatedDebt: Debt): Promise<void> {
    const db = await getDb();
    await db.execAsync('BEGIN EXCLUSIVE TRANSACTION');
    try {
      // 1. Insert Transaction
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, fee, sourceWalletId, destinationWalletId, categoryId, note, transactionDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.type,
        transaction.amount,
        transaction.fee || 0,
        transaction.sourceWalletId,
        transaction.destinationWalletId || null,
        transaction.categoryId || null,
        transaction.note || null,
        transaction.transactionDate,
        transaction.createdAt,
        transaction.updatedAt
      );

      // 2. Adjust Wallet Balance
      if (transaction.type === 'expense') {
        await db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updatedAt = ? WHERE id = ?',
          transaction.amount + (transaction.fee || 0),
          transaction.updatedAt,
          transaction.sourceWalletId
        );
      } else if (transaction.type === 'income') {
        await db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updatedAt = ? WHERE id = ?',
          transaction.amount,
          transaction.updatedAt,
          transaction.sourceWalletId
        );
      }

      // 3. Insert Debt Payment
      await db.runAsync(
        `INSERT INTO debt_payments (id, debtId, walletId, amount, paymentDate, note, transactionId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        debtPayment.id,
        debtPayment.debtId,
        debtPayment.walletId,
        debtPayment.amount,
        debtPayment.paymentDate,
        debtPayment.note || null,
        debtPayment.transactionId,
        debtPayment.createdAt,
        debtPayment.updatedAt
      );

      // 4. Update Debt
      await db.runAsync(
        `UPDATE debts SET amountPaid = ?, remainingAmount = ?, status = ?, updatedAt = ? WHERE id = ?`,
        updatedDebt.amountPaid,
        updatedDebt.remainingAmount,
        updatedDebt.status,
        updatedDebt.updatedAt,
        updatedDebt.id
      );

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  },

  async updateDebtStatus(id: string, status: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE debts SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), id);
  }
};
