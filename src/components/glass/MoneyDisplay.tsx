import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  size?: 'hero' | 'large' | 'medium' | 'small';
  colorType?: 'default' | 'positive' | 'negative' | 'neutral';
  style?: StyleProp<TextStyle>;
  showDecimals?: boolean;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  currency = '₫', // Based on the app's default
  size = 'medium',
  colorType = 'default',
  style,
  showDecimals = false,
}) => {
  const formattedAmount = showDecimals 
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString();

  const getTextStyle = () => {
    switch (size) {
      case 'hero': return styles.hero;
      case 'large': return styles.large;
      case 'small': return styles.small;
      default: return styles.medium;
    }
  };

  const getColor = () => {
    switch (colorType) {
      case 'positive': return theme.colors.success;
      case 'negative': return theme.colors.danger;
      case 'neutral': return theme.colors.textSecondary;
      default: return theme.colors.textPrimary;
    }
  };

  return (
    <View style={styles.container}>
      {currency !== '' && (
        <Text 
          style={[getTextStyle(), styles.currencySign, { color: getColor() }, style]}
        >
          {currency}
        </Text>
      )}
      <Text 
        style={[getTextStyle(), { color: getColor(), flexShrink: 1 }, style]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.5}
      >
        {formattedAmount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySign: {
    marginRight: 2,
    fontFamily: 'Inter_400Regular', // Sans serif for currency symbols
  },
  hero: {
    ...theme.typography.hero,
    fontVariant: ['tabular-nums'],
  },
  large: {
    ...theme.typography.h1,
    fontVariant: ['tabular-nums'],
  },
  medium: {
    ...theme.typography.h2,
    fontVariant: ['tabular-nums'],
  },
  small: {
    ...theme.typography.h3,
    fontVariant: ['tabular-nums'],
  },
});
