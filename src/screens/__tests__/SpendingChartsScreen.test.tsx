import React from 'react';
import { render } from '@testing-library/react-native';
import { SpendingChartsScreen } from '../SpendingChartsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

describe('SpendingChartsScreen', () => {
  it('renders correctly', () => {
    (useFinanceStore as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      categories: [],
    });
    (useSettingsStore as unknown as jest.Mock).mockReturnValue({
      settings: { currency: 'USD' }
    });

    const { getByText } = render(
      <SpendingChartsScreen navigation={{} as any} route={{} as any} />
    );

    expect(getByText('Total Expense')).toBeTruthy();
  });
});
