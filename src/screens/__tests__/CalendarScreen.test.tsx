import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarScreen } from '../CalendarScreen';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('CalendarScreen', () => {
  const mockNavigation: any = { navigate: jest.fn(), goBack: jest.fn() };

  it('renders correctly with transactions', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactions: [
          { id: '1', type: 'expense', amount: 100, transactionDate: new Date().toISOString() },
          { id: '2', type: 'income', amount: 200, transactionDate: new Date().toISOString() }
        ]
      };
      return selector(state);
    });

    const { getByText } = render(<CalendarScreen navigation={mockNavigation} route={{} as any} />);
    expect(getByText('Mon')).toBeTruthy();
  });

  it('handles month navigation', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ transactions: [] });
    });

    const { getByText, getByTestId } = render(<CalendarScreen navigation={mockNavigation} route={{} as any} />);
    
    const prevBtn = getByText('<');
    fireEvent.press(prevBtn);
    
    const nextBtn = getByText('>');
    fireEvent.press(nextBtn);
  });
});
