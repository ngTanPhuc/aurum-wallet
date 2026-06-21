import React from 'react';
import { render } from '@testing-library/react-native';
import { PendingRecurringScreen } from '../PendingRecurringScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));
jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

describe('PendingRecurringScreen', () => {
  it('renders correctly', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        pendingRecurringTransactions: [],
        loadPendingRecurringTransactions: jest.fn(),
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
    (useSettingsStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { settings: { defaultCurrency: 'USD', pinEnabled: false, theme: 'system', isFirstRun: false } };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(
      <PendingRecurringScreen navigation={{} as any} route={{} as any} />
    );

    expect(getByText('All Caught Up!')).toBeTruthy();
  });
});
