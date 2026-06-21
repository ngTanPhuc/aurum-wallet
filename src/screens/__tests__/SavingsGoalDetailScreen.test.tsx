import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SavingsGoalDetailScreen } from '../SavingsGoalDetailScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Alert } from 'react-native';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn()
}));

describe('SavingsGoalDetailScreen', () => {
  const mockNavigation: any = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
  const mockRoute: any = { params: { goalId: 'g1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    (useSettingsStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { settings: { defaultCurrency: 'USD', pinEnabled: false, theme: 'system', isFirstRun: false } };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('renders goal not found', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { transactions: [], savingsGoals: [], wallets: [], categories: [], people: [], debts: [], debtPayments: [] };
      return typeof selector === 'function' ? selector(state) : state;
    });
    const { getByText } = render(<SavingsGoalDetailScreen navigation={mockNavigation} route={mockRoute} />);
    expect(getByText('Goal not found.')).toBeTruthy();
  });

  it('renders goal insights and handles add funds', async () => {
    const addTxMock = jest.fn();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        wallets: [{ id: 'w1', name: 'Cash', type: 'cash', balance: 1000, initialBalance: 0, currency: 'USD', includeInTotal: true, isArchived: false, createdAt: '', updatedAt: '' }],
        categories: [],
        transactions: [
          { type: 'expense', amount: 50, savingsGoalId: 'g1', transactionDate: new Date().toISOString() }
        ],
        savingsGoals: [
          { id: 'g1', name: 'Car', targetAmount: 1000, currentAmount: 50, targetDate: '2027-01-01T00:00:00Z' }
        ],
        people: [],
        debts: [],
        debtPayments: [],
        addTransaction: addTxMock,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, getByPlaceholderText } = render(<SavingsGoalDetailScreen navigation={mockNavigation} route={mockRoute} />);
    expect(getByText('Goal Insights')).toBeTruthy();
    expect(getByText('Required Monthly Savings')).toBeTruthy();
    expect(getByText('Projected Completion')).toBeTruthy();

    const input = getByPlaceholderText('0');
    fireEvent.changeText(input, '100');
    
    await act(async () => {
      fireEvent.press(getByText('+ Add Funds'));
    });

    expect(addTxMock).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Funds successfully added to your goal.');
  });
});
