import React from 'react';
import { render } from '@testing-library/react-native';
import { SummaryCard } from '../SummaryCard';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('SummaryCard', () => {
  beforeEach(() => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        settings: {
          currency: 'VND',
          hideBalances: false
        }
      });
    });
  });

  it('renders income card correctly', () => {
    const { getByText } = render(<SummaryCard title="Total Income" amount={5000} type="income" />);
    expect(getByText('Total Income')).toBeTruthy();
    expect(getByText('₫5,000')).toBeTruthy();
  });

  it('renders expense card correctly', () => {
    const { getByText } = render(<SummaryCard title="Total Expense" amount={2000} type="expense" />);
    expect(getByText('Total Expense')).toBeTruthy();
    expect(getByText('₫2,000')).toBeTruthy();
  });

  it('renders balance card correctly', () => {
    const { getByText } = render(<SummaryCard title="Net Balance" amount={3000} type="balance" />);
    expect(getByText('Net Balance')).toBeTruthy();
    expect(getByText('₫3,000')).toBeTruthy();
  });
});
