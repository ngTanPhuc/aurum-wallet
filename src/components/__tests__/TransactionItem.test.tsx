import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionItem } from '../TransactionItem';
import { Transaction } from '../../types';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('TransactionItem', () => {
  beforeEach(() => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        wallets: [
          { id: 'w1', name: 'Cash', currency: 'VND', type: 'cash', balance: 0, initialBalance: 0, includeInTotal: true, isArchived: false, createdAt: '', updatedAt: '' },
          { id: 'w2', name: 'Bank', currency: 'USD', type: 'bank', balance: 0, initialBalance: 0, includeInTotal: true, isArchived: false, createdAt: '', updatedAt: '' }
        ],
        categories: [
          { id: 'c1', name: 'Food', icon: '🍔', isDefault: false, isArchived: false, type: 'expense', createdAt: '', updatedAt: '' }
        ],
        settings: {
          currency: 'VND',
          hideBalances: false
        }
      });
    });
  });

  it('renders expense transaction correctly', () => {
    const mockTx: Transaction = {
      id: 'tx1',
      type: 'expense',
      amount: 50000,
      sourceWalletId: 'w1',
      categoryId: 'c1',
      transactionDate: '2023-10-01T12:00:00Z',
      note: 'Lunch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<TransactionItem transaction={mockTx} />);
    expect(getByText('🍔')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('-₫50,000')).toBeTruthy();
    // Subtitle includes Date • Wallet • Note
    // "Oct 01, 2023 • Cash • Lunch"
    // Just finding part of it is enough or exact match
    expect(getByText('Oct 01, 2023 • Cash • Lunch')).toBeTruthy();
  });

  it('renders transfer transaction correctly', () => {
    const mockTx: Transaction = {
      id: 'tx2',
      type: 'transfer',
      amount: 100,
      sourceWalletId: 'w2',
      destinationWalletId: 'w1',
      transactionDate: '2023-10-02T12:00:00Z',
      note: 'Transfer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<TransactionItem transaction={mockTx} />);
    expect(getByText('swap-horizontal')).toBeTruthy();
    expect(getByText('Transfer to Cash')).toBeTruthy();
    expect(getByText('Oct 02, 2023 • Bank • Transfer')).toBeTruthy();
  });

  it('handles onPress', () => {
    const onPressMock = jest.fn();
    const mockTx: Transaction = {
      id: 'tx3',
      type: 'income',
      amount: 2000,
      sourceWalletId: 'w1',
      transactionDate: '2023-10-03T12:00:00Z',
      note: 'Salary',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<TransactionItem transaction={mockTx} onPress={onPressMock} />);
    fireEvent.press(getByText('income')); // Default name if no category
    expect(onPressMock).toHaveBeenCalledWith(mockTx);
  });
});
