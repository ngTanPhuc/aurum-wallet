import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MoneyAmount } from './MoneyAmount';
import { theme } from '../theme/theme';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  currency?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type, currency }) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'income': return { color: theme.colors.success, bgColor: theme.colors.successBg };
      case 'expense': return { color: theme.colors.danger, bgColor: theme.colors.dangerBg };
      case 'balance': return { color: theme.colors.info, bgColor: theme.colors.surfaceHighlight };
    }
  };

  const { color, bgColor } = getIconAndColor();

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <Text style={styles.title}>{title}</Text>
      <MoneyAmount 
        amount={amount} 
        currency={currency} 
        style={[styles.amount, { color }]} 
        colorType="neutral" // Force override by the style array
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    marginHorizontal: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...theme.typography.caption, marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600', },
  amount: { ...theme.typography.h3, fontWeight: 'bold', },
});
