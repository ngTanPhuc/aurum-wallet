import { DebtService } from '../DebtService';
import { Debt } from '../../types';

// ─── Mock DB ─────────────────────────────────────────────────────────────────
jest.mock('../../database/db', () => ({
  getDb: jest.fn(() =>
    Promise.resolve({
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
    })
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeDebt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'd1',
  personId: 'p1',
  direction: 'lent',
  principalAmount: 1000,
  interestType: 'none',
  interestRate: 0,
  interestAmount: 0,
  totalExpectedAmount: 1000,
  amountPaid: 0,
  remainingAmount: 1000,
  walletId: 'w1',
  startDate: '2026-01-01T00:00:00.000Z',
  status: 'active',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  openingTransactionId: 't1',
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DebtService', () => {

  // ── calculateDebtInterest ─────────────────────────────────────────────────
  describe('calculateDebtInterest', () => {
    it('returns 0 when type is "none"', () => {
      expect(DebtService.calculateDebtInterest(1000, 5, 'none', '2026-01-01')).toBe(0);
    });

    it('returns 0 when rate is 0', () => {
      expect(DebtService.calculateDebtInterest(1000, 0, 'flat', '2026-01-01')).toBe(0);
      expect(DebtService.calculateDebtInterest(1000, 0, 'simple_annual', '2026-01-01')).toBe(0);
    });

    it('calculates flat interest correctly (10% of 1000 = 100)', () => {
      const result = DebtService.calculateDebtInterest(1000, 10, 'flat', '2026-01-01');
      expect(result).toBeCloseTo(100, 2);
    });

    it('calculates simple annual interest correctly (12% on 1000 for 365 days = 120)', () => {
      const start = '2026-01-01T00:00:00.000Z';
      const due = '2027-01-01T00:00:00.000Z'; // 365 days
      const result = DebtService.calculateDebtInterest(1000, 12, 'simple_annual', start, due);
      expect(result).toBeCloseTo(120, 1);
    });

    it('calculates simple annual interest for 30 days (10% on 1000 ≈ 8.22)', () => {
      const start = '2026-01-01T00:00:00.000Z';
      const due = '2026-01-31T00:00:00.000Z'; // 30 days
      const result = DebtService.calculateDebtInterest(1000, 10, 'simple_annual', start, due);
      expect(result).toBeCloseTo((1000 * 10 * 30) / (100 * 365), 4);
    });

    it('uses today when no dueDate is provided for simple_annual', () => {
      // Use 10 days ago to ensure the result is non-zero and measurable
      const start = new Date();
      start.setDate(start.getDate() - 10);
      const result = DebtService.calculateDebtInterest(10000, 36.5, 'simple_annual', start.toISOString());
      // ~10 days of 36.5% on 10000 ≈ 100 (10 * 10 = 100)
      expect(result).toBeGreaterThan(0);
      // Allow generous margin since exact days can vary slightly by time of day
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(115);
    });
  });

  // ── calculateTotalExpectedAmount ──────────────────────────────────────────
  describe('calculateTotalExpectedAmount', () => {
    it('sums principal and interest', () => {
      expect(DebtService.calculateTotalExpectedAmount(1000, 100)).toBe(1100);
    });

    it('returns principal when interest is 0', () => {
      expect(DebtService.calculateTotalExpectedAmount(500, 0)).toBe(500);
    });
  });

  // ── calculateRemainingAmount ──────────────────────────────────────────────
  describe('calculateRemainingAmount', () => {
    it('subtracts paid from total', () => {
      expect(DebtService.calculateRemainingAmount(1100, 500)).toBe(600);
    });

    it('clamps to 0 when overpaid', () => {
      expect(DebtService.calculateRemainingAmount(1000, 1500)).toBe(0);
    });

    it('returns total when nothing paid', () => {
      expect(DebtService.calculateRemainingAmount(1000, 0)).toBe(1000);
    });
  });

  // ── isDebtOverdue ─────────────────────────────────────────────────────────
  describe('isDebtOverdue', () => {
    it('returns false for paid debts', () => {
      const debt = makeDebt({ status: 'paid', dueDate: '2020-01-01', remainingAmount: 0 });
      expect(DebtService.isDebtOverdue(debt)).toBe(false);
    });

    it('returns false for cancelled debts', () => {
      const debt = makeDebt({ status: 'cancelled', dueDate: '2020-01-01', remainingAmount: 100 });
      expect(DebtService.isDebtOverdue(debt)).toBe(false);
    });

    it('returns false when there is no dueDate', () => {
      const debt = makeDebt({ status: 'active', remainingAmount: 500 });
      expect(DebtService.isDebtOverdue(debt)).toBe(false);
    });

    it('returns true when dueDate is in the past and remaining > 0', () => {
      const debt = makeDebt({ status: 'active', dueDate: '2000-01-01', remainingAmount: 100 });
      expect(DebtService.isDebtOverdue(debt)).toBe(true);
    });

    it('returns false when dueDate is in the future', () => {
      const debt = makeDebt({ status: 'active', dueDate: '2099-12-31', remainingAmount: 100 });
      expect(DebtService.isDebtOverdue(debt)).toBe(false);
    });

    it('returns false when remaining is 0 (fully paid despite status)', () => {
      const debt = makeDebt({ status: 'active', dueDate: '2000-01-01', remainingAmount: 0 });
      expect(DebtService.isDebtOverdue(debt)).toBe(false);
    });
  });

  // ── getDebtStatus ─────────────────────────────────────────────────────────
  describe('getDebtStatus', () => {
    it('returns "paid" when remaining is 0', () => {
      expect(DebtService.getDebtStatus(0, 1000, 1000)).toBe('paid');
    });

    it('returns "paid" when amountPaid >= totalExpected', () => {
      expect(DebtService.getDebtStatus(0, 1100, 1000)).toBe('paid');
    });

    it('returns "overdue" when past due date and has remaining', () => {
      expect(DebtService.getDebtStatus(500, 500, 1000, '2000-01-01')).toBe('overdue');
    });

    it('returns "partially_paid" when some paid, not overdue', () => {
      expect(DebtService.getDebtStatus(500, 500, 1000, '2099-12-31')).toBe('partially_paid');
    });

    it('returns "partially_paid" when some paid and no due date', () => {
      expect(DebtService.getDebtStatus(500, 500, 1000)).toBe('partially_paid');
    });

    it('returns "active" when nothing paid and not overdue', () => {
      expect(DebtService.getDebtStatus(1000, 0, 1000, '2099-12-31')).toBe('active');
    });

    it('returns "active" when nothing paid and no due date', () => {
      expect(DebtService.getDebtStatus(1000, 0, 1000)).toBe('active');
    });
  });
});
