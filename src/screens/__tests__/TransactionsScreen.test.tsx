import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionsScreen } from '../TransactionsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

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

jest.mock('../../components/FilterModal', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    FilterModal: ({ visible, onClose }: any) => {
      if (!visible) return null;
      return (
        <View>
          <Text>FilterModal Visible</Text>
          <TouchableOpacity onPress={onClose}><Text>Close Filter</Text></TouchableOpacity>
        </View>
      );
    }
  };
});

describe('TransactionsScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockSetSearchQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupStore = (overrides = {}) => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation(() => ({
      getFilteredTransactions: () => [],
      transactionSearchQuery: '',
      setTransactionSearchQuery: mockSetSearchQuery,
      transactionFilters: {},
      transactions: [],
      ...overrides
    }));
  };

  it('renders empty state correctly', () => {
    setupStore();
    const { getByText, getByPlaceholderText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('No transactions found.')).toBeTruthy();
    expect(getByPlaceholderText('Search transactions...')).toBeTruthy();
    expect(getByText('⚪')).toBeTruthy(); // No active filters
  });

  it('renders with transactions', () => {
    setupStore({
      getFilteredTransactions: () => [
        { id: 't1', type: 'expense', amount: 100 },
        { id: 't2', type: 'income', amount: 500 }
      ]
    });
    const { getByText, queryByText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(queryByText('No transactions found.')).toBeNull();
    expect(getByText('Tx t1')).toBeTruthy();
    expect(getByText('Tx t2')).toBeTruthy();
  });

  it('navigates to edit transaction when pressing on an item', () => {
    setupStore({
      getFilteredTransactions: () => [
        { id: 't1', type: 'expense', amount: 100 }
      ]
    });
    const { getByText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(getByText('Tx t1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditTransaction', { transactionId: 't1' });
  });

  it('updates search query', () => {
    setupStore();
    const { getByPlaceholderText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.changeText(getByPlaceholderText('Search transactions...'), 'Groceries');
    expect(mockSetSearchQuery).toHaveBeenCalledWith('Groceries');
  });

  it('indicates active filters', () => {
    setupStore({
      transactionFilters: { type: 'expense' }
    });
    const { getByText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('🟣')).toBeTruthy();
  });

  it('opens and closes filter modal', () => {
    setupStore();
    const { getByText, queryByText } = render(<TransactionsScreen navigation={mockNavigation as any} route={{} as any} />);
    
    expect(queryByText('FilterModal Visible')).toBeNull();
    
    // Open modal
    fireEvent.press(getByText('⚪'));
    expect(getByText('FilterModal Visible')).toBeTruthy();

    // Close modal
    fireEvent.press(getByText('Close Filter'));
    expect(queryByText('FilterModal Visible')).toBeNull();
  });
});
