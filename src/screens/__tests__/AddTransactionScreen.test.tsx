import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddTransactionScreen } from '../AddTransactionScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Alert } from 'react-native';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => 'mock-uuid',
}));

jest.mock('../../components/WalletPicker', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    WalletPicker: ({ label, value, onChange }: any) => (
      <View>
        <Text>{label}</Text>
        <Text>Selected Wallet: {value}</Text>
        <TouchableOpacity onPress={() => onChange('w1')}><Text>Set w1</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onChange('w2')}><Text>Set w2</Text></TouchableOpacity>
      </View>
    )
  };
});

jest.mock('../../components/CategoryPicker', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    CategoryPicker: ({ value, onChange, typeFilter }: any) => (
      <View>
        <Text>CategoryPicker {typeFilter}</Text>
        <Text>Selected Category: {value}</Text>
        <TouchableOpacity onPress={() => onChange('c1')}><Text>Set c1</Text></TouchableOpacity>
      </View>
    )
  };
});

jest.mock('../../components/TagPicker', () => {
  const { View, Text } = require('react-native');
  return {
    TagPicker: () => (
      <View><Text>TagPicker</Text></View>
    )
  };
});

describe('AddTransactionScreen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const mockAddTransaction = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const mockAddTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  const setupStore = (overrides = {}) => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [],
        savingsGoals: [],
        templates: [],
        tags: [],
        addTransaction: mockAddTransaction,
        updateTransaction: mockUpdateTransaction,
        addTemplate: mockAddTemplate,
        ...overrides
      };
      return selector(state);
    });
  };

  it('renders correctly for creating a new transaction', () => {
    setupStore();
    const { getByText, getByPlaceholderText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    expect(getByText('expense')).toBeTruthy();
    expect(getByText('income')).toBeTruthy();
    expect(getByText('transfer')).toBeTruthy();
    expect(getByPlaceholderText('0')).toBeTruthy();
    expect(getByText('Save Transaction')).toBeTruthy();
  });

  it('validates empty amount', () => {
    setupStore();
    const { getByText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.press(getByText('Save Transaction'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter an amount');
  });

  it('validates missing wallet', () => {
    setupStore();
    const { getByText, getByPlaceholderText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getByText('Save Transaction'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a wallet');
  });

  it('validates missing category for expense', () => {
    setupStore();
    const { getByText, getByPlaceholderText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getByText('Set w1')); // Set wallet
    fireEvent.press(getByText('Save Transaction'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a category');
  });

  it('validates invalid transfer destination', () => {
    setupStore();
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.press(getByText('transfer')); // Switch to transfer
    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getAllByText('Set w1')[0]); // Set from wallet (mock button)
    // Destination wallet not set
    fireEvent.press(getByText('Save Transaction'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a valid destination wallet');
  });

  it('saves new expense transaction successfully', async () => {
    setupStore();
    const { getByText, getByPlaceholderText } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getByText('Set w1')); // wallet
    fireEvent.press(getByText('Set c1')); // category
    fireEvent.changeText(getByPlaceholderText('What was this for?'), 'Lunch');
    
    fireEvent.press(getByText('Save Transaction'));

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense',
        amount: 1000,
        sourceWalletId: 'w1',
        categoryId: 'c1',
        note: 'Lunch'
      }));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('edits existing transaction correctly', async () => {
    setupStore({
      transactions: [{
        id: 't1', type: 'expense', amount: 500, sourceWalletId: 'w1', categoryId: 'c1'
      }]
    });
    const route = { params: { transactionId: 't1' } };
    const { getByText, getByDisplayValue } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={route as any} />
    );

    expect(getByDisplayValue('500')).toBeTruthy();
    expect(getByText('Save Changes')).toBeTruthy();

    fireEvent.changeText(getByDisplayValue('500'), '600');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith(expect.objectContaining({
        id: 't1',
        amount: 600
      }));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('saves as template', async () => {
    setupStore();
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.changeText(getByPlaceholderText('0'), '1000');
    fireEvent.press(getByText('Set w1')); // wallet
    fireEvent.press(getByText('Set c1')); // category
    fireEvent(getByTestId('save-template-switch'), 'onValueChange', true);
    
    // Type template name
    fireEvent.changeText(getByPlaceholderText('Template Name (e.g., Morning Coffee)'), 'My Template');

    fireEvent.press(getByText('Save Transaction'));

    await waitFor(() => {
      expect(mockAddTemplate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Template',
        type: 'expense',
        amount: 1000,
        sourceWalletId: 'w1',
        categoryId: 'c1'
      }));
    });
  });

  it('applies quick template', () => {
    setupStore({
      templates: [{ id: 'tmpl1', name: 'Coffee', type: 'expense', amount: 5, sourceWalletId: 'w2', categoryId: 'c1' }]
    });

    const { getByText, getByDisplayValue } = render(
      <AddTransactionScreen navigation={mockNavigation as any} route={{} as any} />
    );

    fireEvent.press(getByText('Coffee'));

    expect(getByDisplayValue('5')).toBeTruthy();
    // In actual UI, wallet and category pickers would update correctly
  });
});
