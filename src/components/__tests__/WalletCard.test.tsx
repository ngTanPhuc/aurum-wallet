import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalletCard } from '../WalletCard';
import { Wallet } from '../../types';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn((selector) => {
    const state = {
      settings: {
        currency: 'VND',
        hideBalances: false
      },
      wallets: [{ id: '1' }], 
      transactions: [],
      yieldPocketSettings: [] 
    };
    return selector ? selector(state) : state;
  })
}));

describe('WalletCard', () => {
  const mockWallet: Wallet = {
    id: '1',
    name: 'Main Cash',
    type: 'cash',
    balance: 500,
    currency: 'USD',
    initialBalance: 0,
    includeInTotal: true,
    isArchived: false,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

it('renders wallet details correctly', () => {
    const { getByText } = render(<WalletCard wallet={mockWallet} />);
    expect(getByText('Main Cash')).toBeTruthy();
    expect(getByText('Balance')).toBeTruthy();
  });

  it('handles onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<WalletCard wallet={mockWallet} onPress={onPressMock} />);
    
    fireEvent.press(getByText('Main Cash'));
    expect(onPressMock).toHaveBeenCalledWith(mockWallet);
  });

  it('is disabled when onPress is not provided', () => {
    const { getByText } = render(<WalletCard wallet={mockWallet} />);
    fireEvent.press(getByText('Main Cash'));
  });
});
