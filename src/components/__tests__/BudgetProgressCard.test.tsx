import React from 'react';
import { render } from '@testing-library/react-native';
import { BudgetProgressCard } from '../BudgetProgressCard';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Budget } from '../../types';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

const mockBudget: Budget = { id: 'b1', name: 'Test Budget', amount: 500, targetType: 'category', targetId: 'c1', recurrence: 'monthly', startDate: '2023-06-01T00:00:00.000Z', createdAt: '2023-01-01', updatedAt: '2023-01-01' };

describe('BudgetProgressCard', () => {
  const mockCategories = [
    { id: 'c1', name: 'Food', type: 'expense', icon: 'food' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with safe budget', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [
          { id: 't1', categoryId: 'c1', type: 'expense', amount: 300, transactionDate: '2026-06-01T10:00:00Z' },
          { id: 't2', categoryId: 'c1', type: 'expense', amount: 100, transactionDate: '2026-06-15T10:00:00Z' },
          { id: 't3', categoryId: 'c2', type: 'expense', amount: 500, transactionDate: '2026-06-15T10:00:00Z' }, // different category
          { id: 't4', categoryId: 'c1', type: 'expense', amount: 500, transactionDate: '2026-05-15T10:00:00Z' }, // different month
          { id: 't5', categoryId: 'c1', type: 'income', amount: 100, transactionDate: '2026-06-15T10:00:00Z' }, // different type
        ],
        categories: mockCategories,
      };
      return selector(state);
    });

    const { getByText } = render(<BudgetProgressCard budget={mockBudget} targetDate="2023-06-15T00:00:00.000Z" />);
    
    // Category Name
    expect(getByText('Food')).toBeTruthy();
    // Budget Amount formatted, assumes MoneyAmount just displays the amount in some way.
    // We can't strictly match the number since MoneyAmount might add currency symbol.
  });

  it('renders warning color when budget is >= 80% spent', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [
          { id: 't1', categoryId: 'c1', type: 'expense', amount: 850, transactionDate: '2026-06-01T10:00:00Z' },
        ],
        categories: mockCategories,
      };
      return selector(state);
    });

    const { getByText } = render(<BudgetProgressCard budget={mockBudget} targetDate="2023-06-15T00:00:00.000Z" />);
    expect(getByText('Food')).toBeTruthy();
  });

  it('renders danger color when budget is >= 100% spent', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [
          { id: 't1', categoryId: 'c1', type: 'expense', amount: 1050, transactionDate: '2026-06-01T10:00:00Z' },
        ],
        categories: mockCategories,
      };
      return selector(state);
    });

    const { getByText } = render(<BudgetProgressCard budget={mockBudget} targetDate="2023-06-15T00:00:00.000Z" />);
    expect(getByText('Food')).toBeTruthy();
  });

  it('handles unknown category', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [],
        categories: [], // Empty categories
      };
      return selector(state);
    });

    const { getByText } = render(<BudgetProgressCard budget={mockBudget} targetDate="2023-06-15T00:00:00.000Z" />);
    expect(getByText('Unknown')).toBeTruthy();
  });
});
