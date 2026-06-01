import { FinancialIntegrityService } from '../FinancialIntegrityService';
import { WalletService } from '../WalletService';
import { getDb } from '../../database/db';

jest.mock('../../database/db');
jest.mock('../WalletService', () => ({
  WalletService: {
    getWallets: jest.fn()
  }
}));

describe('FinancialIntegrityService', () => {
  const mockDb = {
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
  };

  beforeEach(() => {
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('detectInconsistencies', () => {
    it('detects no issues when everything matches', async () => {
      (WalletService.getWallets as jest.Mock).mockResolvedValue([
        { id: 'w1', name: 'Cash', balance: 100, initialBalance: 0 }
      ]);
      mockDb.getAllAsync.mockResolvedValue([
        { type: 'income', amount: 100, walletId: 'w1' }
      ]);

      const report = await FinancialIntegrityService.detectInconsistencies();
      expect(report.isHealthy).toBe(true);
      expect(report.issuesCount).toBe(0);
      expect(report.discrepancies).toHaveLength(0);
    });

    it('detects wallet balance discrepancy', async () => {
      (WalletService.getWallets as jest.Mock).mockResolvedValue([
        { id: 'w1', name: 'Cash', balance: 200, initialBalance: 0 } // DB balance says 200
      ]);
      mockDb.getAllAsync.mockResolvedValue([
        { type: 'income', amount: 100, walletId: 'w1' } // Transactions say 100
      ]);

      const report = await FinancialIntegrityService.detectInconsistencies();
      expect(report.isHealthy).toBe(false);
      expect(report.issuesCount).toBe(1);
      expect(report.discrepancies[0].expectedBalance).toBe(100);
      expect(report.discrepancies[0].actualBalance).toBe(200);
    });

    it('handles transfers correctly', async () => {
      (WalletService.getWallets as jest.Mock).mockResolvedValue([
        { id: 'w1', name: 'Bank', balance: 900, initialBalance: 1000 },
        { id: 'w2', name: 'Cash', balance: 100, initialBalance: 0 }
      ]);
      mockDb.getAllAsync.mockResolvedValue([
        { type: 'transfer', amount: 100, walletId: 'w1', destinationWalletId: 'w2' } 
      ]);

      const report = await FinancialIntegrityService.detectInconsistencies();
      expect(report.isHealthy).toBe(true);
    });
  });

  describe('repairBalances', () => {
    it('repairs wallets', async () => {
      const discrepancies = [
        { walletId: 'w1', walletName: 'Bank', expectedBalance: 500, actualBalance: 400, difference: -100 }
      ];

      await FinancialIntegrityService.repairBalances(discrepancies);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE wallets SET balance = ?, updatedAt = ? WHERE id = ?',
        500,
        expect.any(String),
        'w1'
      );
    });
  });
});
