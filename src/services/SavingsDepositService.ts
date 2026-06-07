import { getDb } from '../database/db';
import { SavingsDeposit } from '../types';
import uuid from 'react-native-uuid';
import { TransactionService } from './TransactionService';

export const SavingsDepositService = {
  async getSavingsDeposits(): Promise<SavingsDeposit[]> {
    const db = await getDb();
    return await db.getAllAsync<SavingsDeposit>('SELECT * FROM savings_deposits ORDER BY createdAt DESC');
  },

  async addSavingsDeposit(deposit: SavingsDeposit): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO savings_deposits (id, name, sourceWalletId, payoutWalletId, principalAmount, annualInterestRate, termValue, termUnit, startDate, maturityDate, interestPayoutType, expectedInterestAmount, expectedTotalPayout, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      deposit.id,
      deposit.name,
      deposit.sourceWalletId,
      deposit.payoutWalletId,
      deposit.principalAmount,
      deposit.annualInterestRate,
      deposit.termValue,
      deposit.termUnit,
      deposit.startDate,
      deposit.maturityDate,
      deposit.interestPayoutType,
      deposit.expectedInterestAmount,
      deposit.expectedTotalPayout,
      deposit.status,
      deposit.createdAt,
      deposit.updatedAt
    );

    // Deduct principal from source wallet via transaction
    await TransactionService.addTransaction({
      id: uuid.v4() as string,
      type: 'expense',
      amount: deposit.principalAmount,
      sourceWalletId: deposit.sourceWalletId,
      note: `Deposit to savings: ${deposit.name}`,
      transactionDate: deposit.startDate,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt
    });
  },

  async updateSavingsDeposit(deposit: SavingsDeposit): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE savings_deposits SET
        name = ?, sourceWalletId = ?, payoutWalletId = ?, principalAmount = ?, annualInterestRate = ?, termValue = ?, termUnit = ?, startDate = ?, maturityDate = ?, interestPayoutType = ?, expectedInterestAmount = ?, expectedTotalPayout = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      deposit.name,
      deposit.sourceWalletId,
      deposit.payoutWalletId,
      deposit.principalAmount,
      deposit.annualInterestRate,
      deposit.termValue,
      deposit.termUnit,
      deposit.startDate,
      deposit.maturityDate,
      deposit.interestPayoutType,
      deposit.expectedInterestAmount,
      deposit.expectedTotalPayout,
      deposit.status,
      deposit.updatedAt,
      deposit.id
    );
  },

  calculateMaturityDate(startDate: string, termValue: number, termUnit: 'day' | 'month' | 'year'): string {
    const date = new Date(startDate);
    if (termUnit === 'day') {
      date.setDate(date.getDate() + termValue);
    } else if (termUnit === 'month') {
      date.setMonth(date.getMonth() + termValue);
    } else if (termUnit === 'year') {
      date.setFullYear(date.getFullYear() + termValue);
    }
    return date.toISOString();
  },

  calculateSimpleInterest(principal: number, rate: number, startDate: string, maturityDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(maturityDate).getTime();
    const daysElapsed = (end - start) / (1000 * 60 * 60 * 24);
    return (principal * rate / 100) * (daysElapsed / 365);
  },

  isDepositMatured(deposit: SavingsDeposit): boolean {
    if (deposit.status !== 'active') return false;
    const now = new Date().getTime();
    const maturity = new Date(deposit.maturityDate).getTime();
    return now >= maturity;
  },

  async matureDeposit(deposit: SavingsDeposit, interestCategoryId?: string): Promise<void> {
    if (deposit.status !== 'active') return;

    const now = new Date().toISOString();
    deposit.status = 'matured';
    deposit.updatedAt = now;
    
    await this.updateSavingsDeposit(deposit);

    // Return principal + interest to payout wallet
    // Use an income transaction
    await TransactionService.addTransaction({
      id: uuid.v4() as string,
      type: 'income',
      amount: deposit.expectedTotalPayout,
      sourceWalletId: deposit.payoutWalletId,
      categoryId: interestCategoryId,
      note: `Maturity payout: ${deposit.name}`,
      transactionDate: now,
      createdAt: now,
      updatedAt: now
    });
  },

  async closeEarly(deposit: SavingsDeposit): Promise<void> {
    if (deposit.status !== 'active') return;

    const now = new Date().toISOString();
    deposit.status = 'closed_early';
    deposit.updatedAt = now;
    
    await this.updateSavingsDeposit(deposit);

    // Return only principal (no interest) to payout wallet
    await TransactionService.addTransaction({
      id: uuid.v4() as string,
      type: 'income',
      amount: deposit.principalAmount,
      sourceWalletId: deposit.payoutWalletId,
      note: `Early closure payout: ${deposit.name}`,
      transactionDate: now,
      createdAt: now,
      updatedAt: now
    });
  }
};
