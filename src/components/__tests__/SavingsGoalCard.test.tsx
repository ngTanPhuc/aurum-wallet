import React from 'react';
import { render } from '@testing-library/react-native';
import { SavingsGoalCard } from '../SavingsGoalCard';
import { SavingsGoal } from '../../types';
import { addDays, subDays } from 'date-fns';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: () => ({
    settings: {
      currency: 'VND',
      hideBalances: false
    }
  })
}));

describe('SavingsGoalCard', () => {
  it('renders ongoing goal correctly', () => {
    const mockGoal: SavingsGoal = {
      id: 'g1',
      name: 'Vacation',
      targetAmount: 1000,
      currentAmount: 500,
      icon: '🏝️',
      color: '#007bff',
      isCompleted: false,
      targetDate: addDays(new Date(), 5).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<SavingsGoalCard goal={mockGoal} />);
    
    expect(getByText('Vacation')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('₫500')).toBeTruthy();
    expect(getByText('₫1,000')).toBeTruthy();
    expect(getByText('4 days left')).toBeTruthy();
  });

  it('renders completed goal', () => {
    const mockGoal: SavingsGoal = {
      id: 'g2',
      name: 'Car',
      targetAmount: 5000,
      currentAmount: 5000,
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<SavingsGoalCard goal={mockGoal} />);
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('Goal Reached!')).toBeTruthy();
  });

  it('renders overdue goal', () => {
    const mockGoal: SavingsGoal = {
      id: 'g3',
      name: 'Laptop',
      targetAmount: 1500,
      currentAmount: 1000,
      isCompleted: false,
      targetDate: subDays(new Date(), 2).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { getByText } = render(<SavingsGoalCard goal={mockGoal} />);
    expect(getByText('Overdue')).toBeTruthy();
  });
});
