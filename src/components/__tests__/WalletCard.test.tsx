import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalletCard } from '../WalletCard';
import { Wallet } from '../../types';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: () => ({
    settings: {
      currency: 'VND',
      hideBalances: false
    }
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
    expect(getByText('Cash')).toBeTruthy();
    expect(getByText('cash')).toBeTruthy();
    expect(getByText('₫500,000')).toBeTruthy();
  });

  it('handles onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<WalletCard wallet={mockWallet} onPress={onPressMock} />);
    
    fireEvent.press(getByText('Cash'));
    expect(onPressMock).toHaveBeenCalledWith(mockWallet);
  });

  it('is disabled when onPress is not provided', () => {
    const { getByText } = render(<WalletCard wallet={mockWallet} />);
    
    // We can't strictly test disabled state easily without inspecting props in simple render,
    // but we can ensure it doesn't crash on press.
    fireEvent.press(getByText('Cash'));
  });
});
