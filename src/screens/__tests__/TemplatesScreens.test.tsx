import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TemplatesScreen } from '../TemplatesScreen';
import { AddEditTemplateScreen } from '../AddEditTemplateScreen';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Alert } from 'react-native';

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn()
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

jest.mock('../../components/WalletPicker', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    WalletPicker: ({ onChange }: any) => (
      <View>
        <TouchableOpacity onPress={() => onChange('w1')}><Text>Set w1</Text></TouchableOpacity>
      </View>
    )
  };
});

jest.mock('../../components/CategoryPicker', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    CategoryPicker: ({ onChange }: any) => (
      <View>
        <TouchableOpacity onPress={() => onChange('c1')}><Text>Set c1</Text></TouchableOpacity>
      </View>
    )
  };
});

describe('Templates UI', () => {
  const mockNavigation: any = { navigate: jest.fn(), goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TemplatesScreen', () => {
    it('renders empty state', () => {
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ templates: [], deleteTemplate: jest.fn(), wallets: [], categories: [] });
      });
      const { getByText } = render(<TemplatesScreen navigation={mockNavigation} route={{} as any} />);
      expect(getByText('No templates saved yet.')).toBeTruthy();
    });

    it('renders templates and handles delete', () => {
      const deleteMock = jest.fn();
      jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
      });
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ 
          templates: [{ id: 't1', name: 'Coffee', type: 'expense', amount: 5, sourceWalletId: 'w1' }], 
          deleteTemplate: deleteMock,
          wallets: [],
          categories: []
        });
      });
      const { getByText } = render(<TemplatesScreen navigation={mockNavigation} route={{} as any} />);
      expect(getByText('Coffee')).toBeTruthy();
      
      fireEvent.press(getByText('🗑️'));
      expect(deleteMock).toHaveBeenCalledWith('t1');
    });
  });

  describe('AddEditTemplateScreen', () => {
    it('saves new template', async () => {
      const addMock = jest.fn();
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ 
          templates: [], 
          wallets: [{ id: 'w1', name: 'Cash' }],
          categories: [],
          addTemplate: addMock,
          updateTemplate: jest.fn()
        });
      });

      const { getByText, getByPlaceholderText } = render(<AddEditTemplateScreen navigation={mockNavigation} route={{ params: {} } as any} />);
      
      fireEvent.changeText(getByPlaceholderText('e.g., Morning Coffee'), 'New Template');
      fireEvent.changeText(getByPlaceholderText('0'), '100');
      // Click mock wallet picker
      fireEvent.press(getByText('Set w1'));
      fireEvent.press(getByText('Set c1'));
      
      await act(async () => {
        fireEvent.press(getByText('Save Template'));
      });
      
      expect(addMock).toHaveBeenCalled();
    });

    it('fails to save if name missing', async () => {
      jest.spyOn(Alert, 'alert');
      (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
        return selector({ templates: [], wallets: [], categories: [], addTemplate: jest.fn() });
      });
      const { getByText } = render(<AddEditTemplateScreen navigation={mockNavigation} route={{ params: {} } as any} />);
      await act(async () => {
        fireEvent.press(getByText('Save Template'));
      });
      expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a template name.');
    });
  });
});
