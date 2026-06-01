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
    (useFinanceStore as unknown as jest.Mock).mockReturnValue({
      pendingRecurringTransactions: [],
      loadPendingRecurringTransactions: jest.fn(),
    });
    (useSettingsStore as unknown as jest.Mock).mockReturnValue({
      settings: { currency: 'USD' }
    });

    const { getByText } = render(
      <PendingRecurringScreen navigation={{} as any} route={{} as any} />
    );

    expect(getByText('No pending transactions to review.')).toBeTruthy();
  });
});
