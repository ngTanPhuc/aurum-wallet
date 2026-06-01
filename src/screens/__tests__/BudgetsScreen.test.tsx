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
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
      };
      return selector(state);
    });
  });

  it('renders correctly with no budgets', () => {
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('No Budgets Set')).toBeTruthy();
    expect(getByText('Create Budget')).toBeTruthy();
  });

  it('renders budgets when available', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [
          { id: '1', categoryId: 'c1', amount: 500, month: 6, year: 2026, spent: 100 },
          { id: '2', categoryId: 'c2', amount: 1000, month: 6, year: 2026, spent: 0 }
        ],
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
      };
      return selector(state);
    });

    const { getByText, queryByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(queryByText('No Budgets Set')).toBeNull();
  });

  it('navigates to create budget when pressing Create Budget button', () => {
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(getByText('Create Budget'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditBudget', expect.any(Object));
  });

  it('changes month when pressing prev/next buttons', () => {
    const currentDate = new Date();
    const currentMonthText = format(currentDate, 'MMMM yyyy');
    const nextMonthText = format(addMonths(currentDate, 1), 'MMMM yyyy');
    const prevMonthText = format(subMonths(currentDate, 1), 'MMMM yyyy');

    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    
    expect(getByText(currentMonthText)).toBeTruthy();
    
    fireEvent.press(getByText('>'));
    expect(getByText(nextMonthText)).toBeTruthy();
    
    fireEvent.press(getByText('<'));
    expect(getByText(currentMonthText)).toBeTruthy();
    
    fireEvent.press(getByText('<'));
    expect(getByText(prevMonthText)).toBeTruthy();
  });

  it('navigates to edit budget when pressing on a budget card', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [
          { id: 'b1', categoryId: 'c1', amount: 500, month: 6, year: 2026, spent: 100 },
        ],
        loadBudgetsForMonth: mockLoadBudgetsForMonth,
      };
      return selector(state);
    });
    
    const { getByText } = render(<BudgetsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(getByText('Budget b1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditBudget', { budgetId: 'b1' });
  });
});
