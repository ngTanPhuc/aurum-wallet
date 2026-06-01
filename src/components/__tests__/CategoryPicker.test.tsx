import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryPicker } from '../CategoryPicker';
import { useFinanceStore } from '../../store/useFinanceStore';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('CategoryPicker', () => {
  beforeEach(() => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        categories: [
          { id: 'c1', name: 'Food', type: 'expense', isArchived: false, isDefault: false, createdAt: '', updatedAt: '' },
          { id: 'c2', name: 'Salary', type: 'income', isArchived: false, isDefault: false, createdAt: '', updatedAt: '' },
          { id: 'c3', name: 'Old', type: 'expense', isArchived: true }
        ]
      });
    });
  });

  it('renders correctly without selection', () => {
    const { getByText } = render(<CategoryPicker onChange={jest.fn()} />);
    expect(getByText('Select a category')).toBeTruthy();
  });

  it('renders with selection', () => {
    const { getByText } = render(<CategoryPicker value="c1" onChange={jest.fn()} />);
    expect(getByText('Food')).toBeTruthy();
  });

  it('filters by type', () => {
    const { getByText, queryByText } = render(<CategoryPicker typeFilter="income" onChange={jest.fn()} />);
    fireEvent.press(getByText('Select a category'));
    
    expect(getByText('Salary')).toBeTruthy();
    expect(queryByText('Food')).toBeNull();
    expect(queryByText('Old')).toBeNull(); // Archived
  });

  it('selects category', () => {
    const onChangeMock = jest.fn();
    const { getByText } = render(<CategoryPicker onChange={onChangeMock} />);
    
    fireEvent.press(getByText('Select a category'));
    fireEvent.press(getByText('Food'));
    
    expect(onChangeMock).toHaveBeenCalledWith('c1');
  });

  it('shows error', () => {
    const { getByText } = render(<CategoryPicker error="Required field" onChange={jest.fn()} />);
    expect(getByText('Required field')).toBeTruthy();
  });
});
