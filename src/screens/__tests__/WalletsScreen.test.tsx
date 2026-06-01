import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalletsScreen } from '../WalletsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

jest.mock('../../components/WalletCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return { 
    WalletCard: ({ wallet, onPress }: any) => (
      <TouchableOpacity onPress={() => onPress(wallet)}>
        <Text>Wallet {wallet.id}</Text>
      </TouchableOpacity>
    ) 
  };
});

jest.mock('../../components/GlobalFAB', () => ({
  GlobalFAB: () => <></>
}));

describe('WalletsScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupStore = (wallets = []) => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { wallets };
      return selector(state);
    });
  };

  it('renders correctly with no wallets', () => {
    setupStore([]);
    const { getByText } = render(<WalletsScreen navigation={mockNavigation as any} route={{} as any} />);
    expect(getByText('No wallets found.')).toBeTruthy();
  });

  it('renders active wallets and filters out archived ones', () => {
    setupStore([
      { id: 'w1', isArchived: false, name: 'Main', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' },
      { id: 'w2', isArchived: true, name: 'Old', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' },
      { id: 'w3', isArchived: false, name: 'Savings', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' }
    ]);

    const { getByText, queryByText } = render(<WalletsScreen navigation={mockNavigation as any} route={{} as any} />);
    
    expect(queryByText('No wallets found.')).toBeNull();
    expect(getByText('Wallet w1')).toBeTruthy();
    expect(queryByText('Wallet w2')).toBeNull(); // Archived
    expect(getByText('Wallet w3')).toBeTruthy();
  });

  it('navigates to edit wallet when pressing on a wallet card', () => {
    setupStore([
      { id: 'w1', isArchived: false, name: 'Main', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' }
    ]);
    const { getByText } = render(<WalletsScreen navigation={mockNavigation as any} route={{} as any} />);
    fireEvent.press(getByText('Wallet w1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddEditWallet', { sourceWalletId: 'w1' });
  });
});
