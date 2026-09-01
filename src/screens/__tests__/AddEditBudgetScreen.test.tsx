import React from 'react';
import { appAlert } from '../../components/glass/AppAlert';
jest.mock('../../components/glass/AppAlert', () => ({ appAlert: jest.fn() }));
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddEditBudgetScreen } from '../AddEditBudgetScreen';
import { useFinanceStore } from '../../store/useFinanceStore';


jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('../../components/CategoryPicker', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return { 
    CategoryPicker: ({ value, onChange, typeFilter }: any) => (
      <View>
        <Text>CategoryPicker {typeFilter} {value}</Text>
        <TouchableOpacity onPress={() => onChange('c1')}><Text>Set C1</Text></TouchableOpacity>
      </View>
    ) 
  };
});

jest.mock('react-native-uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('AddEditBudgetScreen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const mockAddBudget = jest.fn();
  const mockUpdateBudget = jest.fn();
  const mockDeleteBudget = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
  });

  const setupStore = (overrides = {}) => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        budgets: [],
        addBudget: mockAddBudget,
        updateBudget: mockUpdateBudget,
        deleteBudget: mockDeleteBudget,
        categories: [{ id: 'c1', type: 'expense', name: 'Food' }],
        ...overrides
      };
      return selector(state);
    });
  };

  it('renders correctly for creating a new budget', () => {
    setupStore();
    const route = { params: { month: 6, year: 2026 } };
    const { getByText, getByPlaceholderText } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    expect(getByText('Budget Amount')).toBeTruthy();
    expect(getByPlaceholderText('0')).toBeTruthy();
    expect(getByText('Save Budget')).toBeTruthy();
  });

  it('renders correctly for editing an existing budget', () => {
    setupStore({
      budgets: [{ id: 'b1', amount: 500, categoryId: 'c1', month: 6, year: 2026 }]
    });
    const route = { params: { budgetId: 'b1' } };
    const { getByText, getByDisplayValue } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    expect(getByDisplayValue('500')).toBeTruthy();
    expect(getByText('Update Budget')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });

  it('validates empty/invalid amount', () => {
    setupStore();
    const route = { params: { month: 6, year: 2026 } };
    const { getByText, getByPlaceholderText } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), 'abc');
    fireEvent.press(getByText('Save Budget'));

    expect(appAlert).toHaveBeenCalledWith('Invalid Amount', 'Please enter a valid budget amount.');
  });


  it('saves new budget successfully', async () => {
    setupStore();
    const route = { params: {} };
    const { getByText, getByPlaceholderText } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getByText('Set C1'));
    fireEvent.press(getByText('Save Budget'));

    await waitFor(() => {
      expect(mockAddBudget).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1000,
        targetId: 'c1',
        targetType: 'category'
      }));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('updates existing budget successfully', async () => {
    setupStore({
      budgets: [{ id: 'b1', name: 'Food Budget', amount: 500, targetType: 'category', targetId: 'c1', recurrence: 'monthly', startDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
    });
    const route = { params: { budgetId: 'b1' } };
    const { getByText, getByDisplayValue } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    fireEvent.changeText(getByDisplayValue('500'), '1000');
    fireEvent.press(getByText('Update Budget'));

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalledWith(expect.objectContaining({
        id: 'b1',
        amount: 1000
      }));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('deletes budget', async () => {
    setupStore({
      budgets: [{ id: 'b1', amount: 500, categoryId: 'c2', month: 6, year: 2026 }]
    });
    const route = { params: { budgetId: 'b1' } };
    const { getByText } = render(
      <AddEditBudgetScreen navigation={mockNavigation as any} route={route as any} />
    );

    fireEvent.press(getByText('Delete'));

    // Find delete in alert buttons
    const alertCall = (appAlert as any).mock.calls[0];
    expect(alertCall[0]).toBe('Delete Budget');
    
    // Call the delete onPress
    await alertCall[2][1].onPress();
    
    expect(mockDeleteBudget).toHaveBeenCalledWith('b1');
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
