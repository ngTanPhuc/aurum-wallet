import React from 'react';
import { appAlert } from '../../components/glass/AppAlert';
jest.mock('../../components/glass/AppAlert', () => ({ appAlert: jest.fn() }));
import { render, fireEvent, act } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { FinancialIntegrityService } from '../../services/FinancialIntegrityService';


jest.mock('../../services/FinancialIntegrityService', () => ({
  FinancialIntegrityService: {
    detectInconsistencies: jest.fn(),
    repairBalances: jest.fn()
  }
}));

jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));

describe('SettingsScreen', () => {
  const mockNavigation: any = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (jest.requireMock('../../store/useSettingsStore').useSettingsStore as jest.Mock).mockReturnValue({
      settings: { defaultCurrency: 'USD', theme: 'system', pinEnabled: false, isFirstRun: false },
      updateCurrency: jest.fn(),
      wipeData: jest.fn(),
    });
    (jest.requireMock('../../store/useFinanceStore').useFinanceStore as jest.Mock).mockImplementation((selector: any) => {
      return selector({ loadData: jest.fn() });
    });
  });

  it('renders settings menu', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} route={{} as any} />);
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Advanced')).toBeTruthy();
    expect(getByText('Transaction Templates')).toBeTruthy();
    expect(getByText('Data Integrity Check')).toBeTruthy();
  });

  it('navigates to templates and tags', () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} route={{} as any} />);
    fireEvent.press(getByText('Transaction Templates'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Templates');

    fireEvent.press(getByText('Manage Tags'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Tags');
  });

  it('handles check data integrity with no issues', async () => {
    
    (FinancialIntegrityService.detectInconsistencies as jest.Mock).mockResolvedValue({
      isHealthy: true,
      issuesCount: 0,
      details: ['All good']
    });

    const { getByText } = render(<SettingsScreen navigation={mockNavigation} route={{} as any} />);
    
    await act(async () => {
      fireEvent.press(getByText('Data Integrity Check'));
    });

    expect(appAlert).toHaveBeenCalledWith(
      'System Healthy',
      expect.stringContaining('All wallet balances perfectly match your transaction history.')
    );
  });

  it('handles check data integrity with issues and repairs', async () => {
    const mockRepair = jest.fn().mockResolvedValue(undefined);
    (FinancialIntegrityService.repairBalances as jest.Mock).mockImplementation(mockRepair);
    
    (FinancialIntegrityService.detectInconsistencies as jest.Mock).mockResolvedValue({
      isHealthy: false,
      issuesCount: 1,
      details: ['Mismatch found'],
      discrepancies: [{ sourceWalletId: 'w1' }]
    });

    // Mock alert to click Repair
    (appAlert as jest.Mock).mockImplementation((title: any, msg: any, buttons: any) => {
      if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
    });

    const { getByText } = render(<SettingsScreen navigation={mockNavigation} route={{} as any} />);
    
    await act(async () => {
      fireEvent.press(getByText('Data Integrity Check'));
    });

    expect(mockRepair).toHaveBeenCalled();
  });
});
