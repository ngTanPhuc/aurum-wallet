import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetsScreen } from '../BudgetsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, addMonths, subMonths } from 'date-fns';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('../../components/BudgetProgressCard', () => {
  const { Text } = require('react-native');
  return { BudgetProgressCard: ({ budget }: any) => <Text>Budget {budget.id}</Text> };
});

jest.mock('../../components/GlobalFAB', () => ({
  GlobalFAB: () => <></>
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => cb()),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

describe('BudgetsScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockLoadBudgetsForMonth = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [],
        loadBudgets: jest.fn(),
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
        getBudgetProgress: jest.fn().mockReturnValue({ budgeted: 500, spent: 100 }),
      };
      return selector(state);
    });
  });

  it('renders correctly with no budgets', () => {
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('No Budgets Yet')).toBeTruthy();
    expect(getByText('New Budget')).toBeTruthy();
  });

  it('renders budgets when available', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [
          { id: '1', name: 'Food', targetType: 'category', targetId: 'c1', amount: 500, recurrence: 'monthly', startDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ],
        loadBudgets: jest.fn(),
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
        getBudgetProgress: jest.fn().mockReturnValue({ budgeted: 500, spent: 100 }),
      };
      return selector(state);
    });

    const { queryByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(queryByText('No Budgets Yet')).toBeNull();
  });

  it('navigates to create budget when pressing New Budget button', () => {
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(getByText('New Budget'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditBudget', expect.any(Object));
  });

  it('renders budget cards', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [
          { id: 'b1', name: 'Groceries', targetType: 'category', targetId: 'c1', amount: 500, recurrence: 'monthly', startDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        loadBudgets: jest.fn(),
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
        getBudgetProgress: jest.fn().mockReturnValue({ budgeted: 500, spent: 100 }),
      };
      return selector(state);
    });
    
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('Budget b1')).toBeTruthy();
  });
});
