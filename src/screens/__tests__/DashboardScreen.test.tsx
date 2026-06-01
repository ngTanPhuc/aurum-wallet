import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('../../components/SummaryCard', () => {
  const { Text } = require('react-native');
  return { SummaryCard: ({ title }: any) => <Text>SummaryCard {title}</Text> };
});

jest.mock('../../components/TransactionItem', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return { 
    TransactionItem: ({ transaction, onPress }: any) => (
      <TouchableOpacity onPress={() => onPress(transaction)}>
        <Text>Tx {transaction.id}</Text>
      </TouchableOpacity>
    ) 
  };
});

jest.mock('../../components/GlobalFAB', () => ({
  GlobalFAB: () => <></>
}));

jest.mock('../../components/MetricCard', () => {
  const { Text } = require('react-native');
  return { MetricCard: ({ title }: any) => <Text>MetricCard {title}</Text> };
});

jest.mock('../../components/InsightCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return { 
    InsightCard: ({ insight, onActionPress }: any) => (
      <TouchableOpacity onPress={() => onActionPress(insight.actionRoute)}>
        <Text>Insight {insight.id}</Text>
      </TouchableOpacity>
    ) 
  };
});

jest.mock('../../components/SavingsGoalCard', () => {
  const { Text } = require('react-native');
  return { SavingsGoalCard: ({ goal }: any) => <Text>SavingsGoal {goal.id}</Text> };
});

describe('DashboardScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useSettingsStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { settings: { defaultCurrency: 'USD' } };
      return selector(state);
    });
  });

  const setupStore = (overrides = {}) => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation(() => ({
      getTotalBalance: () => 5000,
      transactions: [],
      savingsGoals: [],
      pendingRecurringTransactions: [],
      getSavingsRate: () => ({ rate: 10, trend: 2 }),
      getCashFlow: () => ({ net: 1000, isPositive: true }),
      getLargestSpendingCategory: () => null,
      getInsights: () => [],
      ...overrides
    }));
  };

  it('renders correctly with no data', () => {
    setupStore();
    const { getByText, queryByText } = render(<DashboardScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('Financial Health')).toBeTruthy();
    expect(queryByText('Pending Transactions')).toBeNull();
    expect(getByText('No transactions yet.')).toBeTruthy();
  });

  it('renders correctly with pending transactions, active goal, insights, and transactions', () => {
    const now = new Date();
    setupStore({
      transactions: [
        { id: 't1', type: 'income', amount: 3000, transactionDate: now.toISOString() },
        { id: 't2', type: 'expense', amount: 500, transactionDate: now.toISOString() },
      ],
      savingsGoals: [{ id: 'g1', isCompleted: false }],
      pendingRecurringTransactions: [{ id: 'p1' }],
      getLargestSpendingCategory: () => ({ categoryName: 'Food', percentage: 40 }),
      getInsights: () => [{ id: 'i1', actionRoute: 'Transactions' }],
    });

    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} route={{} as any} />);
    
    // Check pending banner
    expect(getByText('Pending Transactions')).toBeTruthy();
    fireEvent.press(getByText('Pending Transactions'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PendingRecurring');

    // Metrics
    expect(getByText('MetricCard Top Expense')).toBeTruthy();
    
    // Insights
    expect(getByText('Smart Insights')).toBeTruthy();
    fireEvent.press(getByText('Insight i1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Transactions');

    // Goals
    expect(getByText('Active Goal')).toBeTruthy();
    fireEvent.press(getByText('SavingsGoal g1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SavingsGoalDetail', { goalId: 'g1' });
  });

  it('navigates correctly from See All buttons and transactions', () => {
    const now = new Date();
    setupStore({
      transactions: [
        { id: 't1', type: 'expense', amount: 10, transactionDate: now.toISOString() },
      ],
      savingsGoals: [{ id: 'g1', isCompleted: false }],
    });

    const { getByText, getAllByText } = render(<DashboardScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const seeAllButtons = getAllByText('See All');
    expect(seeAllButtons).toHaveLength(2);

    // Goal see all
    fireEvent.press(seeAllButtons[0]);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SavingsGoals');

    // Transactions see all
    fireEvent.press(seeAllButtons[1]);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Transactions');

    // Transaction item
    fireEvent.press(getByText('Tx t1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditTransaction', { transactionId: 't1' });
  });

  it('handles negative cash flow and negative savings rate trend', () => {
    setupStore({
      getSavingsRate: () => ({ rate: 5, trend: -3 }),
      getCashFlow: () => ({ net: -200, isPositive: false }),
    });

    const { getByText } = render(<DashboardScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('Financial Health')).toBeTruthy();
  });
});
