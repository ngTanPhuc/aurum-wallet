import { TransactionService } from '../TransactionService';
import { getDb } from '../../database/db';
import { WalletService } from '../WalletService';
import { SavingsGoalService } from '../SavingsGoalService';
import { Transaction } from '../../types';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('../WalletService', () => ({
  WalletService: {
    updateWalletBalance: jest.fn(),
  },
}));

jest.mock('../SavingsGoalService', () => ({
  SavingsGoalService: {
    updateSavingsGoalAmount: jest.fn(),
  },
}));

describe('TransactionService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return transactions with tags mapped correctly', async () => {
      const mockTxs = [
        { id: 'tx1', amount: 100 },
        { id: 'tx2', amount: 200 },
      ];
      
      const mockTags = [
        { transactionId: 'tx1', id: 'tag1', name: 'Tag 1', color: '#000', createdAt: 'date1' },
        { transactionId: 'tx1', id: 'tag2', name: 'Tag 2', color: '#111', createdAt: 'date2' },
        { transactionId: 'tx2', id: 'tag1', name: 'Tag 1', color: '#000', createdAt: 'date1' },
      ];

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockTxs) // First call for transactions
        .mockResolvedValueOnce(mockTags); // Second call for tags

      const result = await TransactionService.getTransactions();

      expect(mockDb.getAllAsync).toHaveBeenNthCalledWith(1, 'SELECT * FROM transactions ORDER BY transactionDate DESC, createdAt DESC');
      expect(mockDb.getAllAsync).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT tt.transactionId, t.* FROM tags t'));

      expect(result).toEqual([
        {
          id: 'tx1',
          amount: 100,
          tags: [
            { id: 'tag1', name: 'Tag 1', color: '#000', createdAt: 'date1' },
            { id: 'tag2', name: 'Tag 2', color: '#111', createdAt: 'date2' },
          ],
        },
        {
          id: 'tx2',
          amount: 200,
          tags: [
            { id: 'tag1', name: 'Tag 1', color: '#000', createdAt: 'date1' },
          ],
        },
      ]);
    });

    it('should handle transactions without tags', async () => {
      const mockTxs = [{ id: 'tx1', amount: 100 }];
      mockDb.getAllAsync
        .mockResolvedValueOnce(mockTxs)
        .mockResolvedValueOnce([]);

      const result = await TransactionService.getTransactions();
      expect(result[0].tags).toEqual([]);
    });
  });

  describe('getTransactionById', () => {
    it('should return null if transaction not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const result = await TransactionService.getTransactionById('tx1');
      expect(result).toBeNull();
    });

    it('should return transaction with tags', async () => {
      const mockTx = { id: 'tx1', amount: 100 };
      const mockTags = [{ id: 'tag1', name: 'Tag 1', color: '#000', createdAt: 'date1' }];

      mockDb.getFirstAsync.mockResolvedValue(mockTx);
      mockDb.getAllAsync.mockResolvedValue(mockTags);

      const result = await TransactionService.getTransactionById('tx1');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM transactions WHERE id = ?', 'tx1');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.* FROM tags t'),
        ['tx1']
      );

      expect(result).toEqual({
        ...mockTx,
        tags: mockTags,
      });
    });
  });

  describe('addTransaction', () => {
    it('should insert transaction and apply effect', async () => {
      const tx: Transaction = { note: '', 
        id: 'tx1',
        type: 'expense',
        amount: 100,
        sourceWalletId: 'w1',
        transactionDate: 'date',
        createdAt: 'date',
        updatedAt: 'date',
      };

      const applyEffectSpy = jest.spyOn(TransactionService, 'applyTransactionEffect').mockResolvedValue();

      await TransactionService.addTransaction(tx);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        'tx1', 'expense', 100, 'w1', '', 'date', 'date', 'date'
      );
      expect(applyEffectSpy).toHaveBeenCalledWith(tx);
    });

    it('should handle all optional fields and tags', async () => {
      const tx: Transaction = { note: '', 
        id: 'tx1',
        type: 'transfer',
        amount: 100,
        sourceWalletId: 'w1',
        destinationWalletId: 'w2',
        categoryId: 'c1',
        savingsGoalId: 's1',
        note: 'note',
        transactionDate: 'date',
        createdAt: 'date',
        updatedAt: 'date',
        tags: [{ id: 'tag1' } as any, { id: 'tag2' } as any],
      };

      const applyEffectSpy = jest.spyOn(TransactionService, 'applyTransactionEffect').mockResolvedValue();

      await TransactionService.addTransaction(tx);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        'tx1', 'transfer', 100, 'w1', 'w2', 'c1', 's1', 'note', 'date', 'date', 'date'
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)',
        ['tx1', 'tag1']
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)',
        ['tx1', 'tag2']
      );

      expect(applyEffectSpy).toHaveBeenCalledWith(tx);
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction, modify tags, and apply new effect', async () => {
      const oldTx = { id: 'tx1', type: 'expense', amount: 50 };
      const tx: Transaction = { note: '', 
        id: 'tx1',
        type: 'expense',
        amount: 100,
        sourceWalletId: 'w1',
        destinationWalletId: 'w2',
        categoryId: 'c1',
        savingsGoalId: 's1',
        note: 'note',
        transactionDate: 'date',
        createdAt: 'date',
        updatedAt: 'date',
        tags: [{ id: 'tag1' } as any],
      };

      const getSpy = jest.spyOn(TransactionService, 'getTransactionById').mockResolvedValue(oldTx as any);
      const reverseSpy = jest.spyOn(TransactionService, 'reverseTransactionEffect').mockResolvedValue();
      const applySpy = jest.spyOn(TransactionService, 'applyTransactionEffect').mockResolvedValue();

      await TransactionService.updateTransaction(tx);

      expect(getSpy).toHaveBeenCalledWith('tx1');
      expect(reverseSpy).toHaveBeenCalledWith(oldTx);
      
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions SET'),
        'expense', 100, 'w1', 'w2', 'c1', 's1', 'note', 'date', 'date', 'tx1'
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM transaction_tags WHERE transactionId = ?', ['tx1']);
      expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', ['tx1', 'tag1']);

      expect(applySpy).toHaveBeenCalledWith(tx);
    });

    it('should handle optional fields and no tags', async () => {
      const oldTx = { id: 'tx1', type: 'expense', amount: 50 };
      const tx: Transaction = { note: '', 
        id: 'tx1',
        type: 'expense',
        amount: 100,
        sourceWalletId: 'w1',
        transactionDate: 'date',
        createdAt: 'date',
        updatedAt: 'date',
      };

      jest.spyOn(TransactionService, 'getTransactionById').mockResolvedValue(oldTx as any);
      jest.spyOn(TransactionService, 'reverseTransactionEffect').mockResolvedValue();
      jest.spyOn(TransactionService, 'applyTransactionEffect').mockResolvedValue();

      await TransactionService.updateTransaction(tx);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions SET'),
        'expense', 100, 'w1', '', 'date', 'date', 'tx1'
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should reverse effect and delete transaction', async () => {
      const oldTx = { id: 'tx1', type: 'expense', amount: 50 };
      const getSpy = jest.spyOn(TransactionService, 'getTransactionById').mockResolvedValue(oldTx as any);
      const reverseSpy = jest.spyOn(TransactionService, 'reverseTransactionEffect').mockResolvedValue();

      await TransactionService.deleteTransaction('tx1');

      expect(getSpy).toHaveBeenCalledWith('tx1');
      expect(reverseSpy).toHaveBeenCalledWith(oldTx);
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM transactions WHERE id = ?', 'tx1');
    });

    it('should just delete if old tx not found', async () => {
      jest.spyOn(TransactionService, 'getTransactionById').mockResolvedValue(null);
      const reverseSpy = jest.spyOn(TransactionService, 'reverseTransactionEffect').mockResolvedValue();

      await TransactionService.deleteTransaction('tx1');

      expect(reverseSpy).not.toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM transactions WHERE id = ?', 'tx1');
    });
  });

  describe('applyTransactionEffect', () => {
    it('should apply expense', async () => {
      await TransactionService.applyTransactionEffect({ type: 'expense', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
    });

    it('should apply expense with savings goal', async () => {
      await TransactionService.applyTransactionEffect({ type: 'expense', sourceWalletId: 'w1', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', 100);
    });

    it('should apply income', async () => {
      await TransactionService.applyTransactionEffect({ type: 'income', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
    });

    it('should apply income with savings goal', async () => {
      await TransactionService.applyTransactionEffect({ type: 'income', sourceWalletId: 'w1', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', -100);
    });

    it('should apply transfer', async () => {
      await TransactionService.applyTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', destinationWalletId: 'w2', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w2', 100);
    });

    it('should apply transfer with savings goal', async () => {
      await TransactionService.applyTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', destinationWalletId: 'w2', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w2', 100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', 100);
    });

    it('should apply transfer without destination (edge case)', async () => {
      await TransactionService.applyTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledTimes(1);
    });

    it('should apply adjustment', async () => {
      await TransactionService.applyTransactionEffect({ type: 'adjustment', sourceWalletId: 'w1', amount: 50 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 50);
    });
  });

  describe('reverseTransactionEffect', () => {
    it('should reverse expense', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'expense', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
    });

    it('should reverse expense with savings goal', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'expense', sourceWalletId: 'w1', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', -100);
    });

    it('should reverse income', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'income', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
    });

    it('should reverse income with savings goal', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'income', sourceWalletId: 'w1', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', 100);
    });

    it('should reverse transfer', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', destinationWalletId: 'w2', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w2', -100);
    });

    it('should reverse transfer with savings goal', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', destinationWalletId: 'w2', amount: 100, savingsGoalId: 's1' } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w2', -100);
      expect(SavingsGoalService.updateSavingsGoalAmount).toHaveBeenCalledWith('s1', -100);
    });

    it('should reverse transfer without destination (edge case)', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'transfer', sourceWalletId: 'w1', amount: 100 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', 100);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledTimes(1);
    });

    it('should reverse adjustment', async () => {
      await TransactionService.reverseTransactionEffect({ type: 'adjustment', sourceWalletId: 'w1', amount: 50 } as any);
      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('w1', -50);
    });
  });
});
