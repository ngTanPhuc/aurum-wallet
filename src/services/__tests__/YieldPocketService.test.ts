import { YieldPocketService } from '../YieldPocketService';
import { YieldPocketSettings } from '../../types';
import { TransactionService } from '../TransactionService';
import { WalletService } from '../WalletService';

// ─── Mock dependencies ───────────────────────────────────────────────────────

const mockDb = {
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('../../database/db', () => ({
  getDb: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('../TransactionService', () => ({
  TransactionService: {
    addTransaction: jest.fn(),
  },
}));

jest.mock('../WalletService', () => ({
  WalletService: {
    getWallets: jest.fn(),
  },
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePocket = (overrides: Partial<YieldPocketSettings> = {}): YieldPocketSettings => ({
  walletId: 'w1',
  yieldRule: 'T1_FUND',
  currentApy: 5,
  interestBearingBalance: 0,
  pendingDeposit: 0,
  yieldFrequency: 'daily',
  postingMode: 'auto',
  allowSpendingDirectly: true,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('YieldPocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default: no existing settings (triggers INSERT path)
    mockDb.getFirstAsync.mockResolvedValue(null);
  });

  // ── isYieldDue ──────────────────────────────────────────────────────────────
  describe('isYieldDue', () => {
    it('returns true if nextYieldDate is missing (treat as immediately due)', () => {
      expect(YieldPocketService.isYieldDue(makePocket())).toBe(true);
    });

    it('returns true if nextYieldDate is in the past', () => {
      const pastDate = new Date(Date.now() - 86_400_000).toISOString();
      expect(YieldPocketService.isYieldDue(makePocket({ nextYieldDate: pastDate }))).toBe(true);
    });

    it('returns false if nextYieldDate is in the future', () => {
      const futureDate = new Date(Date.now() + 86_400_000).toISOString();
      expect(YieldPocketService.isYieldDue(makePocket({ nextYieldDate: futureDate }))).toBe(false);
    });
  });

  // ── calculateExpectedYieldAmount ────────────────────────────────────────────
  describe('calculateExpectedYieldAmount', () => {
    it('calculates daily yield correctly (3.65% on 10 000 = 1/day)', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'w1', balance: 10_000 });
      const result = await YieldPocketService.calculateExpectedYieldAmount(
        makePocket({ yieldRule: 'STANDARD', currentApy: 3.65, yieldFrequency: 'daily' })
      );
      expect(result).toBeCloseTo(1, 2);
    });

    it('calculates monthly yield correctly (12% on 12 000 = 120/month)', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'w1', balance: 12_000 });
      const result = await YieldPocketService.calculateExpectedYieldAmount(
        makePocket({ yieldRule: 'STANDARD', currentApy: 12, yieldFrequency: 'monthly' })
      );
      expect(result).toBeCloseTo(120, 2);
    });

    it('returns 0 if wallet is not found', async () => {
      (WalletService.getWallets as jest.Mock).mockResolvedValue([]);
      const result = await YieldPocketService.calculateExpectedYieldAmount(makePocket());
      expect(result).toBe(0);
    });
  });

  // ── postYield ───────────────────────────────────────────────────────────────
  describe('postYield', () => {
    it('posts a transaction using the Yield Interest category found in DB', async () => {
      // category look-up
      mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'cat-id' }); // category query
      // subsequent getFirstAsync for saveSettings -> getSettingsForWallet -> INSERT path
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const addTransactionCb = jest.fn().mockResolvedValue(undefined);
      await YieldPocketService.postYield(makePocket(), 15, addTransactionCb);

      expect(addTransactionCb).toHaveBeenCalledWith(15, expect.any(String));
    });

    it('still posts a transaction even when Yield Interest category is missing', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null); // no category, no existing settings

      await YieldPocketService.postYield(makePocket(), 5, async () => {});
    });

    it('saves updated settings after posting yield', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ id: 'cat-id' }) // category
        .mockResolvedValueOnce(makePocket());     // existing settings → UPDATE path

      await YieldPocketService.postYield(makePocket(), 10, async () => {});

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE yield_pocket_settings'),
        expect.anything(), // yieldRule
        expect.anything(), // currentApy
        expect.anything(), // yieldFrequency
        expect.anything(), // postingMode
        expect.anything(), // lastYieldCalculatedAt
        expect.anything(), // nextYieldDate
        expect.anything(), // allowSpendingDirectly
        expect.anything(), // interestBearingBalance
        expect.anything(), // pendingDeposit
        null, // lastRolloverDate
        null, // lastSyncDate
        expect.anything(), // updatedAt
        'w1'              // walletId
      );
    });
  });

  // ── getNextYieldDate ────────────────────────────────────────────────────────
  describe('getNextYieldDate', () => {
    it('advances by 1 day for daily frequency', () => {
      const base = '2026-07-01T00:00:00.000Z';
      const next = YieldPocketService.getNextYieldDate(base, 'daily');
      expect(new Date(next).getDate()).toBe(new Date(base).getDate() + 1);
    });

    it('advances by 1 month for monthly frequency', () => {
      const base = '2026-07-01T00:00:00.000Z';
      const next = YieldPocketService.getNextYieldDate(base, 'monthly');
      expect(new Date(next).getMonth()).toBe(new Date(base).getMonth() + 1);
    });

    it('clamps month-end overflow: Jan 31 + 1 month = Feb 28 (not Mar 3)', () => {
      const base = '2026-01-31T00:00:00.000Z';
      const next = YieldPocketService.getNextYieldDate(base, 'monthly');
      const nextDate = new Date(next);
      // Should be Feb 28 (2026 is not a leap year), NOT March 3
      expect(nextDate.getMonth()).toBe(1); // February = 1
      expect(nextDate.getDate()).toBe(28);
    });

    it('clamps month-end overflow: Jan 31 + 1 month in leap year = Feb 29', () => {
      const base = '2024-01-31T00:00:00.000Z'; // 2024 is a leap year
      const next = YieldPocketService.getNextYieldDate(base, 'monthly');
      const nextDate = new Date(next);
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(29); // leap day
    });

    it('uses creationDate when lastDateStr is undefined', () => {
      const creation = '2026-07-01T00:00:00.000Z';
      const next = YieldPocketService.getNextYieldDate(creation, 'daily');
      expect(new Date(next).getDate()).toBe(new Date(creation).getDate() + 1);
    });
  });

  // ── Edge cases: zero values ─────────────────────────────────────────────────
  describe('calculateDailyYield — edge cases', () => {
    it('returns 0 when balance is 0', () => {
      expect(YieldPocketService.calculateDailyYield(0, 5)).toBe(0);
    });

    it('returns 0 when rate is 0', () => {
      expect(YieldPocketService.calculateDailyYield(10000, 0)).toBe(0);
    });
  });

  describe('calculateMonthlyYield — edge cases', () => {
    it('returns 0 when balance is 0', () => {
      expect(YieldPocketService.calculateMonthlyYield(0, 12)).toBe(0);
    });

    it('returns 0 when rate is 0', () => {
      expect(YieldPocketService.calculateMonthlyYield(10000, 0)).toBe(0);
    });
  });
});

