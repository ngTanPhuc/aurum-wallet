import { RecurringTransactionService } from '../RecurringTransactionService';
import { TransactionService } from '../TransactionService';
import { getDb } from '../../database/db';

jest.mock('../../database/db');
jest.mock('../TransactionService', () => ({
  TransactionService: {
    addTransaction: jest.fn().mockResolvedValue(true),
  }
}));

describe('RecurringTransactionService', () => {
  const mockDb = {
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
  };

  beforeEach(() => {
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('calculateNextDueDate', () => {
    it('calculates daily frequency correctly', () => {
      const next = RecurringTransactionService.calculateNextDueDate('2026-06-01T10:00:00.000Z', 'daily');
      expect(next).toBe('2026-06-02T10:00:00.000Z');
    });

    it('calculates weekly frequency correctly', () => {
      const next = RecurringTransactionService.calculateNextDueDate('2026-06-01T10:00:00.000Z', 'weekly');
      expect(next).toBe('2026-06-08T10:00:00.000Z');
    });

    it('calculates monthly frequency correctly', () => {
      const next = RecurringTransactionService.calculateNextDueDate('2026-06-01T10:00:00.000Z', 'monthly');
      expect(next).toBe('2026-07-01T10:00:00.000Z');
    });

    it('calculates yearly frequency correctly', () => {
      const next = RecurringTransactionService.calculateNextDueDate('2026-06-01T10:00:00.000Z', 'yearly');
      expect(next).toBe('2027-06-01T10:00:00.000Z');
    });
  });

  describe('getRecurringTransactions', () => {
    it('returns formatted transactions', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: '1', isActive: 1 },
        { id: '2', isActive: 0 }
      ]);
      const result = await RecurringTransactionService.getRecurringTransactions();
      expect(result).toEqual([
        { id: '1', isActive: true, isSubscription: false },
        { id: '2', isActive: false, isSubscription: false }
      ]);
    });
  });

  describe('getPendingTransactions', () => {
    it('returns only active pending transactions', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: '1', isActive: 1 }
      ]);
      const result = await RecurringTransactionService.getPendingTransactions();
      expect(result).toEqual([{ id: '1', isActive: true, isSubscription: false }]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM recurring_transactions WHERE isActive = 1 AND nextDueDate <= ? ORDER BY nextDueDate ASC;',
        [expect.any(String)]
      );
    });
  });

  describe('CRUD operations', () => {
    const mockRt: any = {
      id: '1', type: 'expense', amount: 100, sourceWalletId: 'w1', destinationWalletId: undefined,
      categoryId: 'c1', note: 'test', frequency: 'monthly', startDate: '2026-06-01T00:00:00.000Z',
      nextDueDate: '2026-06-01T00:00:00.000Z', isActive: true, createdAt: '...', updatedAt: '...'
    };

    it('addRecurringTransaction', async () => {
      await RecurringTransactionService.addRecurringTransaction(mockRt);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('updateRecurringTransaction', async () => {
      await RecurringTransactionService.updateRecurringTransaction(mockRt);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('deleteRecurringTransaction', async () => {
      await RecurringTransactionService.deleteRecurringTransaction('1');
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM recurring_transactions WHERE id = ?;', ['1']);
    });
  });

  describe('Processing operations', () => {
    const mockRt: any = {
      id: '1', type: 'expense', amount: 100, sourceWalletId: 'w1',
      frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00.000Z', isActive: true
    };

    it('skipPendingTransaction increments due date without creating a transaction', async () => {
      // updateRecurringTransaction will be called inside skip
      jest.spyOn(RecurringTransactionService, 'updateRecurringTransaction').mockResolvedValue();
      const updated = await RecurringTransactionService.skipPendingTransaction(mockRt);
      
      expect(updated.nextDueDate).toBe('2026-07-01T00:00:00.000Z');
      expect(RecurringTransactionService.updateRecurringTransaction).toHaveBeenCalledWith(updated);
      expect(TransactionService.addTransaction).not.toHaveBeenCalled();
    });

    it('confirmPendingTransaction creates a transaction and increments due date', async () => {
      jest.spyOn(RecurringTransactionService, 'skipPendingTransaction').mockResolvedValue({
        ...mockRt,
        nextDueDate: '2026-07-01T00:00:00.000Z'
      });

      const result = await RecurringTransactionService.confirmPendingTransaction(mockRt);
      
      expect(TransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          amount: 100,
          sourceWalletId: 'w1',
          transactionDate: '2026-06-01T00:00:00.000Z' // Logs on the due date
        })
      );
      expect(result.updatedRecurring.nextDueDate).toBe('2026-07-01T00:00:00.000Z');
    });

    it('confirmPendingTransaction handles custom edited transaction data', async () => {
      jest.spyOn(RecurringTransactionService, 'skipPendingTransaction').mockResolvedValue({
        ...mockRt,
        nextDueDate: '2026-07-01T00:00:00.000Z'
      });

      await RecurringTransactionService.confirmPendingTransaction(mockRt, { amount: 150, note: 'Edited Note' });
      
      expect(TransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150,
          note: 'Edited Note'
        })
      );
    });
  });
});
