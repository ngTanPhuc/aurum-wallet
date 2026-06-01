import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalletPicker } from '../WalletPicker';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('WalletPicker', () => {
  beforeEach(() => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        wallets: [
          { id: 'w1', name: 'Cash', balance: 1000, currency: 'VND', isArchived: false, createdAt: '', updatedAt: '' },
          { id: 'w2', name: 'Bank', balance: 5000, currency: 'USD', initialBalance: 0, includeInTotal: true, isArchived: false, createdAt: '', updatedAt: '' },
          { id: 'w3', name: 'Old', balance: 0, currency: 'VND', isArchived: true }
        ],
        settings: {
          currency: 'VND',
          hideBalances: false
        }
      });
    });
  });

  it('renders correctly with no selection', () => {
    const { getByText } = render(<WalletPicker label="From Wallet" onChange={jest.fn()} />);
    expect(getByText('From Wallet')).toBeTruthy();
    expect(getByText('Select a wallet')).toBeTruthy();
  });

  it('renders correctly with selection', () => {
    const { getByText } = render(<WalletPicker label="From Wallet" value="w1" onChange={jest.fn()} />);
    expect(getByText('Cash')).toBeTruthy();
  });

  it('opens modal and selects wallet', () => {
    const onChangeMock = jest.fn();
    const { getByText, queryByText } = render(<WalletPicker label="From Wallet" onChange={onChangeMock} />);
    
    fireEvent.press(getByText('Select a wallet'));
    
    // Modal should be visible and show available wallets (not archived)
    expect(getByText('Select Wallet')).toBeTruthy();
    expect(getByText('Bank')).toBeTruthy();
    expect(queryByText('Old')).toBeNull(); // Archived

    fireEvent.press(getByText('Bank'));
    expect(onChangeMock).toHaveBeenCalledWith('w2');
  });

  it('excludes specified wallet', () => {
    const { getByText, queryByText } = render(<WalletPicker label="From Wallet" excludeWalletId="w2" onChange={jest.fn()} />);
    
    fireEvent.press(getByText('Select a wallet'));
    expect(getByText('Cash')).toBeTruthy();
    expect(queryByText('Bank')).toBeNull(); // Excluded
  });
});
