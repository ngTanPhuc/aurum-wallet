import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlobalFAB } from '../GlobalFAB';
import { useNavigation } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

describe('GlobalFAB', () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: navigateMock,
    });
  });

  it('renders fab button', () => {
    const { getByText } = render(<GlobalFAB />);
    expect(getByText('add')).toBeTruthy();
  });

  it('opens menu on fab press', () => {
    const { getByText } = render(<GlobalFAB />);
    
    const fabBtn = getByText('add');
    fireEvent.press(fabBtn);
    
    expect(getByText('close')).toBeTruthy();
    expect(getByText('New Goal')).toBeTruthy();
    expect(getByText('New Budget')).toBeTruthy();
    expect(getByText('New Recurring')).toBeTruthy();
    expect(getByText('New Wallet')).toBeTruthy();
    expect(getByText('New Transaction')).toBeTruthy();
  });

  it('navigates to AddEditTransaction when selected', () => {
    const { getByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('add'));
    expect(navigateMock).toHaveBeenCalledWith('AddEditTransaction', {});
  });

  it('navigates to AddEditWallet when selected', () => {
    const { getByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('wallet'));
    expect(navigateMock).toHaveBeenCalledWith('AddEditWallet', {});
  });

  it('navigates to AddEditBudget when selected', () => {
    const { getByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('pie-chart'));
    expect(navigateMock).toHaveBeenCalledWith('AddEditBudget', expect.objectContaining({ month: expect.any(Number), year: expect.any(Number) }));
  });

  it('navigates to AddEditSavingsGoal when selected', () => {
    const { getByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('flag'));
    expect(navigateMock).toHaveBeenCalledWith('AddEditSavingsGoal', {});
  });

  it('navigates to AddEditRecurringTransaction when selected', () => {
    const { getByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('repeat'));
    expect(navigateMock).toHaveBeenCalledWith('AddEditRecurringTransaction', {});
  });

  it('closes menu when overlay is pressed', () => {
    const { getByText, queryByText } = render(<GlobalFAB />);
    fireEvent.press(getByText('add'));
    
    fireEvent.press(getByText('close'));
    
    expect(queryByText('New Transaction')).toBeNull();
  });
});
