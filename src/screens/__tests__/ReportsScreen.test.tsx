import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReportsScreen } from '../ReportsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

describe('ReportsScreen', () => {
  const mockNavigation: any = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [],
        categories: [],
        budgets: [],
        settings: { currency: 'USD' }
      };
      return selector(state);
    });

    const { getByText } = render(
      <ReportsScreen navigation={mockNavigation} route={{} as any} />
    );

    expect(getByText('Insights & Planning')).toBeTruthy();
    expect(getByText('Monthly Budgets')).toBeTruthy();
  });
});
