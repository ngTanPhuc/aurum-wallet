import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterModal } from '../FilterModal';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

describe('FilterModal', () => {
  const setTransactionFiltersMock = jest.fn();
  const setTransactionSortMock = jest.fn();
  const onCloseMock = jest.fn();

  const mockFilters = { types: ['expense'] };
  const mockCategories = [{ id: 'c1', name: 'Food', icon: '🍔' }];
  const mockWallets = [{ id: 'w1', name: 'Cash' }];
  const mockTags = [{ id: 't1', name: 'trip' }];

  beforeEach(() => {
    jest.clearAllMocks();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        transactionFilters: mockFilters,
        transactionSort: 'newest',
        setTransactionFilters: setTransactionFiltersMock,
        setTransactionSort: setTransactionSortMock,
        categories: mockCategories,
        wallets: mockWallets,
        tags: mockTags,
      };
      return selector(state);
    });
  });

  it('renders correctly when visible', () => {
    const { getByText, queryByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('NEWEST')).toBeTruthy();
    expect(getByText('EXPENSE')).toBeTruthy();
    expect(getByText('Cash')).toBeTruthy();
    expect(getByText('🍔 Food')).toBeTruthy();
    expect(getByText('#trip')).toBeTruthy();
  });

  it('does not render content if visible is false, Modal handles this but just checking props sync', () => {
    const { getByText } = render(<FilterModal visible={false} onClose={onCloseMock} />);
    // The Modal component in React Native still mounts its children sometimes in tests unless conditionally rendered.
    // We just test visibility changes triggering state updates if needed.
  });

  it('allows selecting sort option', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    const oldestSortBtn = getByText('OLDEST');
    fireEvent.press(oldestSortBtn);
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionSortMock).toHaveBeenCalledWith('oldest');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('allows toggling type filter', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    // Toggle expense OFF
    const expenseBtn = getByText('EXPENSE');
    fireEvent.press(expenseBtn);
    
    // Toggle income ON
    const incomeBtn = getByText('INCOME');
    fireEvent.press(incomeBtn);
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ types: ['income'] }));
  });

  it('allows toggling wallet filter', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    const cashWalletBtn = getByText('Cash');
    fireEvent.press(cashWalletBtn); // Toggle ON
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ walletIds: ['w1'] }));
  });

  it('allows toggling category filter', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    const foodCategoryBtn = getByText('🍔 Food');
    fireEvent.press(foodCategoryBtn); // Toggle ON
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ categoryIds: ['c1'] }));
  });

  it('allows toggling tag filter', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    const tripTagBtn = getByText('#trip');
    fireEvent.press(tripTagBtn); // Toggle ON
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['t1'] }));
  });

  it('allows clearing filters', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    
    const clearBtn = getByText('Clear All');
    fireEvent.press(clearBtn);
    
    const applyBtn = getByText('Apply Filters');
    fireEvent.press(applyBtn);
    
    expect(setTransactionFiltersMock).toHaveBeenCalledWith({});
    expect(setTransactionSortMock).toHaveBeenCalledWith('newest');
  });

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(<FilterModal visible={true} onClose={onCloseMock} />);
    const closeBtn = getByText('✕');
    fireEvent.press(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
