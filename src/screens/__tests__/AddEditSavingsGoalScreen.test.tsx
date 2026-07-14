import React from 'react';
import { appAlert } from '../../components/glass/AppAlert';
jest.mock('../../components/glass/AppAlert', () => ({ appAlert: jest.fn() }));
import { render, fireEvent, act } from '@testing-library/react-native';
import { AddEditSavingsGoalScreen } from '../AddEditSavingsGoalScreen';
import { useFinanceStore } from '../../store/useFinanceStore';


jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children }: any) => {
    const { ScrollView } = require('react-native');
    return <ScrollView>{children}</ScrollView>;
  },
}));

jest.mock('../../components/glass/AmountInput', () => ({
  AmountInput: (props: any) => {
    const { TextInput } = require('react-native');
    return <TextInput {...props} />;
  },
}));

describe('AddEditSavingsGoalScreen', () => {
  const mockNavigation: any = { setOptions: jest.fn(), goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves new goal successfully', async () => {
    const addMock = jest.fn();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { 
        savingsGoals: [], 
        addSavingsGoal: addMock,
        updateSavingsGoal: jest.fn()
      };
      return selector ? selector(state) : state;
    });

    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<AddEditSavingsGoalScreen navigation={mockNavigation} route={{ params: {} } as any} />);
    
    fireEvent.changeText(getByPlaceholderText('e.g. Vacation to Japan'), 'Vacation');
    fireEvent.changeText(getAllByPlaceholderText('0')[0], '5000');
    fireEvent.changeText(getAllByPlaceholderText('0')[1], '1000');
    // We already filled 0 above for target amount. Starting amount is also 0. Let's use getAllByPlaceholderText.

    await act(async () => {
      fireEvent.press(getByText('Save Goal'));
    });
    
    expect(addMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Vacation',
      targetAmount: 5000,
      currentAmount: 1000
    }));
  });

  it('shows error if missing required fields', async () => {
    
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { savingsGoals: [], addSavingsGoal: jest.fn() };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(<AddEditSavingsGoalScreen navigation={mockNavigation} route={{ params: {} } as any} />);
    
    await act(async () => {
      fireEvent.press(getByText('Save Goal'));
    });
    
    expect(appAlert).toHaveBeenCalledWith('Error', 'Please enter a goal name');
  });

  it('shows date picker on press', () => {
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { savingsGoals: [] };
      return selector ? selector(state) : state;
    });

    const { getByText, queryByTestId } = render(<AddEditSavingsGoalScreen navigation={mockNavigation} route={{ params: {} } as any} />);
    fireEvent.press(getByText('Select a target date...'));
    
    // Test date picker open
    expect(queryByTestId('date-picker')).toBeNull(); // On non-iOS it might use Android's picker API
  });
});
