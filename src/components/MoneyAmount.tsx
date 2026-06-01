import React from 'react';
import { Text, TextProps } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';

interface MoneyAmountProps extends TextProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  colorType?: 'positive' | 'negative' | 'neutral' | 'auto';
}

export const MoneyAmount: React.FC<MoneyAmountProps> = ({ 
  amount, 
  currency, 
  showSign = false, 
  colorType = 'auto',
  style, 
  ...props 
}) => {
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);
  const displayCurrency = currency || defaultCurrency;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
    minimumFractionDigits: displayCurrency === 'VND' ? 0 : 2,
  }).format(Math.abs(amount));

  let sign = '';
  if (amount < 0 || colorType === 'negative') {
    sign = '-';
  } else if (showSign && amount > 0) {
    sign = '+';
  }
  const displayText = `${sign}${formattedAmount}`;

  let color = theme.colors.text; // neutral
  if (colorType === 'auto') {
    if (amount > 0) color = theme.colors.success;
    if (amount < 0) color = theme.colors.danger;
  } else if (colorType === 'positive') {
    color = theme.colors.success;
  } else if (colorType === 'negative') {
    color = theme.colors.danger;
  }

  return (
    <Text style={[{ color }, style]} {...props}>
      {displayText}
    </Text>
  );
};
