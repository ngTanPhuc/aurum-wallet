import { YieldPocketService } from '../YieldPocketService';
import { YieldPocketSettings, Wallet } from '../../types';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withExclusiveTransactionAsync: jest.fn(async (cb) => { await cb(); }),
};

jest.mock('../../database/db', () => ({
  getDb: jest.fn(() => mockDb),
}));

describe('YieldPocketEngine', () => {
  let mockSettings: YieldPocketSettings;

  beforeEach(() => {
    mockSettings = {
      walletId: 'w1',
      yieldRule: 'T1_FUND',
      currentApy: 5,
      yieldFrequency: 'daily',
      postingMode: 'auto',
      allowSpendingDirectly: true,
      interestBearingBalance: 1000,
      pendingDeposit: 500,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    jest.spyOn(YieldPocketService, 'getSettingsForWallet').mockResolvedValue(mockSettings);
    jest.spyOn(YieldPocketService, 'saveSettings').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('T1_FUND Withdrawals', () => {
    it('deducts entirely from pending if amount <= pending', async () => {
      await YieldPocketService.onWithdraw('w1', 200);
      expect(mockSettings.pendingDeposit).toBe(300);
      expect(mockSettings.interestBearingBalance).toBe(1000);
    });

    it('deducts from pending then interestBearing if amount > pending', async () => {
      await YieldPocketService.onWithdraw('w1', 700);
      expect(mockSettings.pendingDeposit).toBe(0);
      expect(mockSettings.interestBearingBalance).toBe(800);
    });

    it('allows going negative if amount > total balance (self-healing for out of sync wallets)', async () => {
      await YieldPocketService.onWithdraw('w1', 2000);
      expect(mockSettings.pendingDeposit).toBe(0);
      expect(mockSettings.interestBearingBalance).toBe(-500); // 1500 total - 2000
    });
  });

  describe('STANDARD Rule', () => {
    it('ignores onDeposit and onWithdraw rules for pending limits', async () => {
      mockSettings.yieldRule = 'STANDARD';
      await YieldPocketService.onDeposit('w1', 5000);
      expect(mockSettings.pendingDeposit).toBe(500); // Unchanged

      await YieldPocketService.onWithdraw('w1', 99999);
      expect(mockSettings.interestBearingBalance).toBe(1000); // Unchanged
    });
  });

  describe('Yield Calculations', () => {
    it('calculates daily yield correctly', () => {
      expect(YieldPocketService.calculateDailyYield(100000, 5)).toBe(13);
    });

    it('calculates monthly yield correctly', () => {
      expect(YieldPocketService.calculateMonthlyYield(100000, 5)).toBe(416);
    });
  });

  describe('Smart Sync Reverse APY', () => {
    it('infers APY correctly when interest differs', async () => {
      mockSettings.lastSyncDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      
      mockDb.getFirstAsync.mockResolvedValueOnce({ balance: 1000 }); // Mock wallet.balance
      
      // Let's say the discrepancy is 200 (extra 200 earned)
      // 30 days elapsed. 1000 balance. 
      // predicted: (1000 * 5% / 365) * 30 = 0 (because floor(1000*0.05/365) = 0)
      // actualTotal = 0 + 200 = 200.
      // avgDaily = 200 / 30 = 6.66...
      // inferredApy = (6.66 * 365 / 1000) * 100 = 243.3% -> EXCEEDS 15% limit.
      // So APY should NOT change.
      
      const addTransaction = jest.fn().mockResolvedValue(undefined);

      await YieldPocketService.syncActualBalance('w1', 1200, new Date(), addTransaction);
      expect(addTransaction).toHaveBeenCalledWith(200);
      expect(mockSettings.currentApy).toBe(5); // Guardrail hit!
    });
    
    it('updates APY within valid guardrails', async () => {
      const lastSync = new Date('2023-01-01T00:00:00.000Z');
      const syncDate = new Date('2023-01-31T00:00:00.000Z'); // exactly 30 days
      mockSettings.lastSyncDate = lastSync.toISOString();
      mockSettings.interestBearingBalance = 100000;
      
      mockDb.getFirstAsync.mockResolvedValueOnce({ balance: 100000 }); 
      
      // 30 days elapsed. 100k balance.
      // predicted @ 5%: 13 * 30 = 390
      // pastDaysInterest: 13 * 29 = 377
      // Let's sync to 100,012. Discrepancy = +12.
      // actualTotal = 390 + 12 = 402.
      // lastDayInterest = 402 - 377 = 25.
      // inferredApy = (25 * 365 / 100000) * 100 = 9.125
      
      const addTransaction = jest.fn().mockResolvedValue(undefined);

      await YieldPocketService.syncActualBalance('w1', 100012, syncDate, addTransaction);
      expect(addTransaction).toHaveBeenCalledWith(12);
      expect(mockSettings.currentApy).toBeCloseTo(9.125, 2);
      expect(mockSettings.pendingDeposit).toBe(488); // 500 initial - 12 rollover
      expect(mockSettings.interestBearingBalance).toBe(100012); 
    });
  });
});
