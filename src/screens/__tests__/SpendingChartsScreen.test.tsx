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
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        transactions: [],
        categories: [],
      };
      return selector ? selector(state) : state;
    });
    (useSettingsStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { settings: { defaultCurrency: 'USD', pinEnabled: false, theme: 'system', isFirstRun: false } };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(
      <SpendingChartsScreen navigation={{} as any} route={{} as any} />
    );

    expect(getByText('Analytics')).toBeTruthy();
  });
});
