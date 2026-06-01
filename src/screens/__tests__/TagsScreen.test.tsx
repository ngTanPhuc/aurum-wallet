import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TagsScreen } from '../TagsScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Alert } from 'react-native';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

describe('TagsScreen', () => {
  const mockNavigation: any = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tags and handles add', async () => {
    const addMock = jest.fn();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ 
        tags: [{ id: 't1', name: 'Important', color: '#ff0000' }], 
        addTag: addMock,
        updateTag: jest.fn(),
        deleteTag: jest.fn()
      });
    });

    const { getByText, getByPlaceholderText } = render(<TagsScreen navigation={mockNavigation} route={{} as any} />);
    expect(getByText('#Important')).toBeTruthy();
    
    // Open add modal
    fireEvent.press(getByText('+'));
    
    const input = getByPlaceholderText('e.g., Vacation');
    fireEvent.changeText(input, 'New Tag');
    
    await act(async () => {
      fireEvent.press(getByText('Save'));
    });
    
    expect(addMock).toHaveBeenCalled();
  });

  it('handles delete', () => {
    const deleteMock = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
    });
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ 
        tags: [{ id: 't1', name: 'Important', color: '#ff0000' }], 
        deleteTag: deleteMock 
      });
    });

    const { getByText } = render(<TagsScreen navigation={mockNavigation} route={{} as any} />);
    fireEvent.press(getByText('🗑️'));
    expect(deleteMock).toHaveBeenCalledWith('t1');
  });
});
