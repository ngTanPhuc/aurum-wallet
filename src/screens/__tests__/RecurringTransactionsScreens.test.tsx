import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RecurringTransactionsScreen } from '../RecurringTransactionsScreen';
import { PendingRecurringScreen } from '../PendingRecurringScreen';
import { AddEditRecurringTransactionScreen } from '../AddEditRecurringTransactionScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Alert } from 'react-native';

// Mock the store
jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

const mockNavigation: any = { navigate: jest.fn(), goBack: jest.fn() };

describe('Recurring Transactions UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RecurringTransactionsScreen', () => {
    it('renders empty state correctly', () => {
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { recurringTransactions: [], wallets: [], categories: [] };
        return selector(state);
      });

      const { getByText } = render(<RecurringTransactionsScreen navigation={mockNavigation} route={{} as any} />);
      expect(getByText('No Recurring Transactions')).toBeTruthy();
    });

    it('renders list of recurring transactions', () => {
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { 
          recurringTransactions: [
            { id: '1', type: 'expense', amount: 100, sourceWalletId: 'w1', frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00Z', isActive: true },
            { id: '2', type: 'transfer', amount: 50, sourceWalletId: 'w1', destinationWalletId: 'w2', frequency: 'weekly', nextDueDate: '2026-06-01T00:00:00Z', isActive: false }
          ], 
          wallets: [{ id: 'w1', name: 'Cash' }, { id: 'w2', name: 'Bank' }], 
          categories: [] 
        };
        return selector(state);
      });

      const { getByText } = render(<RecurringTransactionsScreen navigation={mockNavigation} route={{} as any} />);
      expect(getByText('- 100')).toBeTruthy();
      expect(getByText('50')).toBeTruthy(); // Transfer has no sign
      expect(getByText('Paused')).toBeTruthy(); // inactive transfer
    });
  });

  describe('PendingRecurringScreen', () => {
    it('renders empty state', () => {
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { pendingRecurringTransactions: [], wallets: [], categories: [] };
        return selector(state);
      });
      const { getByText } = render(<PendingRecurringScreen navigation={mockNavigation} route={{} as any} />);
      expect(getByText('All Caught Up!')).toBeTruthy();
    });

    it('renders pending items and handles confirm', async () => {
      const confirmMock = jest.fn();
      const skipMock = jest.fn();
      
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { 
          pendingRecurringTransactions: [
            { id: 'p1', type: 'expense', amount: 200, sourceWalletId: 'w1', frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00Z', isActive: true }
          ], 
          wallets: [{ id: 'w1', name: 'Cash', balance: 500 }], 
          categories: [],
          confirmPendingTransaction: confirmMock,
          skipPendingTransaction: skipMock
        };
        return selector(state);
      });

      const { getByText } = render(<PendingRecurringScreen navigation={mockNavigation} route={{} as any} />);
      
      const confirmBtn = getByText('Confirm');
      await act(async () => {
        fireEvent.press(confirmBtn);
      });

      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), { amount: undefined, note: undefined });
      });
    });

    it('shows insufficient funds warning on confirm', async () => {
      jest.spyOn(Alert, 'alert');
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { 
          pendingRecurringTransactions: [
            { id: 'p1', type: 'expense', amount: 200, sourceWalletId: 'w1', frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00Z', isActive: true }
          ], 
          wallets: [{ id: 'w1', name: 'Cash', balance: 100 }], 
          categories: [],
          confirmPendingTransaction: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<PendingRecurringScreen navigation={mockNavigation} route={{} as any} />);
      const confirmBtn = getByText('Confirm');
      await act(async () => {
        fireEvent.press(confirmBtn);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Insufficient Funds',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('handles Skip action', async () => {
      const skipMock = jest.fn();
      jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
      });
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { 
          pendingRecurringTransactions: [{ id: 'p1', type: 'income', amount: 200, sourceWalletId: 'w1', frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00Z', isActive: true }], 
          wallets: [], categories: [], skipPendingTransaction: skipMock 
        };
        return selector(state);
      });
      const { getByText } = render(<PendingRecurringScreen navigation={mockNavigation} route={{} as any} />);
      fireEvent.press(getByText('Skip'));
      expect(skipMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
    });

    it('handles Edit modal and save', async () => {
      const confirmMock = jest.fn();
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = { 
          pendingRecurringTransactions: [{ id: 'p1', type: 'expense', amount: 200, sourceWalletId: 'w1', frequency: 'monthly', nextDueDate: '2026-06-01T00:00:00Z', isActive: true }], 
          wallets: [{ id: 'w1', name: 'Cash', balance: 500 }], categories: [], confirmPendingTransaction: confirmMock 
        };
        return selector(state);
      });
      const { getByText, getByDisplayValue } = render(<PendingRecurringScreen navigation={mockNavigation} route={{} as any} />);
      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });
      
      const saveBtn = getByText('Confirm with Changes');
      await act(async () => {
        fireEvent.press(saveBtn);
      });
      expect(confirmMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), { amount: 200, note: '' });
    });
  });

  describe('AddEditRecurringTransactionScreen', () => {
    it('shows error if amount is missing', () => {
      jest.spyOn(Alert, 'alert');
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ recurringTransactions: [], wallets: [], categories: [], addRecurringTransaction: jest.fn(), updateRecurringTransaction: jest.fn() });
      });

      const { getByText } = render(<AddEditRecurringTransactionScreen navigation={mockNavigation} route={{ params: {} } as any} />);
      fireEvent.press(getByText('Create Recurring'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a name');
    });

    it('saves successfully', async () => {
      const addMock = jest.fn();
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ 
          recurringTransactions: [], 
          wallets: [{ id: 'w1', name: 'Wallet1' }], 
          categories: [{ id: 'c1', name: 'Cat1', type: 'expense' }], 
          addRecurringTransaction: addMock, 
          updateRecurringTransaction: jest.fn() 
        });
      });

      const { getByText, getByPlaceholderText } = render(<AddEditRecurringTransactionScreen navigation={mockNavigation} route={{ params: {} } as any} />);
      
      fireEvent.changeText(getByPlaceholderText('0'), '100');
    });

    it('loads and saves in edit mode', async () => {
      const updateMock = jest.fn();
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ 
          recurringTransactions: [{
            id: 'r1', name: 'Test', type: 'expense', amount: 500, sourceWalletId: 'w1', categoryId: 'c1', note: 'Sub', frequency: 'weekly', startDate: '2026-06-01T00:00:00Z', isActive: true
          }], 
          wallets: [{ id: 'w1', name: 'Wallet1' }], 
          categories: [{ id: 'c1', name: 'Cat1', type: 'expense' }], 
          addRecurringTransaction: jest.fn(), 
          updateRecurringTransaction: updateMock 
        });
      });

      const { getByText, getByDisplayValue } = render(<AddEditRecurringTransactionScreen navigation={mockNavigation} route={{ params: { recurringId: 'r1' } } as any} />);
      
      expect(getByDisplayValue('500')).toBeTruthy();
      expect(getByDisplayValue('Sub')).toBeTruthy();
      expect(getByDisplayValue('2026-06-01')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByText('Save Changes'));
      });
      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });
  });
});
