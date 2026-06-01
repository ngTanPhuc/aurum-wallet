import React from 'react';
import { render } from '@testing-library/react-native';
import { MoneyAmount } from '../MoneyAmount';
import { useSettingsStore } from '../../store/useSettingsStore';

jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: jest.fn()
}));

describe('MoneyAmount', () => {
  beforeEach(() => {
    (useSettingsStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        settings: {
          defaultCurrency: 'VND',
        }
      });
    });
  });

  it('renders correctly with default settings', () => {
    const { getByText } = render(<MoneyAmount amount={150000} currency="VND" />);
    expect(getByText('₫150,000')).toBeTruthy();
  });



  it('formats other currencies', () => {
    const { getByText } = render(<MoneyAmount amount={1500} currency="USD" />);
    expect(getByText('$1,500.00')).toBeTruthy();
  });
});
