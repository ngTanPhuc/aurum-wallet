import { WalletService } from '../WalletService';
import { getDb } from '../../database/db';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

describe('WalletService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('getWallets', () => {
    it('should return all wallets ordered by createdAt DESC', async () => {
      const mockWallets = [
        { id: '1', name: 'Cash', includeInTotal: 1, isArchived: 0 },
        { id: '2', name: 'Bank', includeInTotal: 0, isArchived: 1 }
      ];
      mockDb.getAllAsync.mockResolvedValue(mockWallets);

      const result = await WalletService.getWallets();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM wallets ORDER BY createdAt DESC');
      expect(result).toEqual([
        { id: '1', name: 'Cash', includeInTotal: true, isArchived: false, isDefault: false, createdAt: '', updatedAt: '' },
        { id: '2', name: 'Bank', includeInTotal: false, isArchived: true }
      ]);
    });
  });

  describe('getWalletById', () => {
    it('should return a wallet if found and convert booleans', async () => {
      const mockWallet = { id: '1', name: 'Cash', includeInTotal: 1, isArchived: 0 };
      mockDb.getFirstAsync.mockResolvedValue(mockWallet);

      const result = await WalletService.getWalletById('1');
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM wallets WHERE id = ?', '1');
      expect(result).toEqual({
        id: '1', name: 'Cash', includeInTotal: true, isArchived: false
      });
    });

    it('should return null if not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await WalletService.getWalletById('2');
      
      expect(result).toBeNull();
    });
  });

  describe('addWallet', () => {
    it('should insert a new wallet', async () => {
      const wallet: any = {
        id: '1', name: 'Cash', type: 'cash', balance: 1000, initialBalance: 1000,
        currency: 'USD', color: '#000', icon: '💰', includeInTotal: true, isArchived: false,
        createdAt: '2023', updatedAt: '2023'
      };

      await WalletService.addWallet(wallet);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallets'),
        '1', 'Cash', 'cash', 1000, 1000, 'USD', '#000', '💰', 1, 0, '2023', '2023'
      );
    });
    
    it('should insert a new wallet with null optional fields', async () => {
      const wallet: any = {
        id: '1', name: 'Cash', type: 'cash', balance: 1000, initialBalance: 1000,
        currency: 'USD', includeInTotal: false, isArchived: true,
        createdAt: '2023', updatedAt: '2023'
      };

      await WalletService.addWallet(wallet);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallets'),
        '1', 'Cash', 'cash', 1000, 1000, 'USD', '', '', 0, 1, '2023', '2023'
      );
    });
  });

  describe('updateWallet', () => {
    it('should update an existing wallet', async () => {
      const wallet: any = {
        id: '1', name: 'Cash', type: 'cash', balance: 1000, initialBalance: 1000,
        currency: 'USD', color: '#000', icon: '💰', includeInTotal: true, isArchived: false,
        updatedAt: '2023'
      };

      await WalletService.updateWallet(wallet);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets SET'),
        'Cash', 'cash', 1000, 1000, 'USD', '#000', '💰', 1, 0, '2023', '1'
      );
    });

    it('should update an existing wallet with null optional fields', async () => {
      const wallet: any = {
        id: '1', name: 'Cash', type: 'cash', balance: 1000, initialBalance: 1000,
        currency: 'USD', includeInTotal: false, isArchived: true,
        updatedAt: '2023'
      };

      await WalletService.updateWallet(wallet);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets SET'),
        'Cash', 'cash', 1000, 1000, 'USD', '', '', 0, 1, '2023', '1'
      );
    });
  });

  describe('deleteWallet', () => {
    it('should delete a wallet', async () => {
      await WalletService.deleteWallet('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM wallets WHERE id = ?', '1');
    });
  });

  describe('updateWalletBalance', () => {
    it('should update wallet balance', async () => {
      await WalletService.updateWalletBalance('1', 500);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE wallets SET balance = balance + ?, updatedAt = ? WHERE id = ?',
        500, expect.any(String), '1'
      );
    });
  });
});
