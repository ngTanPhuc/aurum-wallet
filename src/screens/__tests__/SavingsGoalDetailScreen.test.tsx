import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SavingsGoalDetailScreen } from '../SavingsGoalDetailScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Alert } from 'react-native';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('SavingsGoalDetailScreen', () => {
  const mockNavigation: any = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
  const mockRoute: any = { params: { goalId: 'g1' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders goal not found', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { transactions: [], savingsGoals: [] };
      return selector ? selector(state) : state;
    });
    const { getByText } = render(<SavingsGoalDetailScreen navigation={mockNavigation} route={mockRoute} />);
    expect(getByText('Goal not found.')).toBeTruthy();
  });

  it('renders goal insights and handles add funds', async () => {
    const updateMock = jest.fn();
    jest.spyOn(Alert, 'alert');
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [
          { type: 'expense', amount: 50, savingsGoalId: 'g1', transactionDate: new Date().toISOString() }
        ],
        savingsGoals: [
          { id: 'g1', name: 'Car', targetAmount: 1000, currentAmount: 50, targetDate: '2027-01-01T00:00:00Z' }
        ],
        updateSavingsGoal: updateMock,
        addTransaction: jest.fn(),
        settings: { currency: 'VND' }
      };
      return selector ? selector(state) : state;
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

    expect(updateMock).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Funds successfully added to your goal.');
  });
});
