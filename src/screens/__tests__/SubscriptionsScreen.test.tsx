import React from 'react';
import { render } from '@testing-library/react-native';
import { SubscriptionsScreen } from '../SubscriptionsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('SubscriptionsScreen', () => {
  const mockNavigation: any = { navigate: jest.fn(), goBack: jest.fn() };

  it('renders subscriptions and calculates totals', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ 
        recurringTransactions: [
          { id: '1', name: 'Netflix', isSubscription: true, amount: 15, frequency: 'monthly', type: 'expense', isActive: true },
          { id: '2', name: 'Gym', isSubscription: true, amount: 50, frequency: 'monthly', type: 'expense', isActive: true },
          { id: '3', name: 'Spotify', isSubscription: true, amount: 120, frequency: 'yearly', type: 'expense', isActive: true }
        ],
        wallets: [],
        categories: []
      });
    });

    const { getByText } = render(<SubscriptionsScreen navigation={mockNavigation} route={{} as any} />);
    
    // Netflix 15 + Gym 50 + Spotify 10 = 75/mo
    expect(getByText('Total Monthly Cost')).toBeTruthy();
    expect(getByText('Total Yearly Cost')).toBeTruthy();
    expect(getByText('Netflix')).toBeTruthy();
    expect(getByText('Spotify')).toBeTruthy();
  });

  it('renders empty state', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ recurringTransactions: [], wallets: [], categories: [] });
    });
    const { getByText } = render(<SubscriptionsScreen navigation={mockNavigation} route={{} as any} />);
    expect(getByText('No subscriptions found.')).toBeTruthy();
  });
});
