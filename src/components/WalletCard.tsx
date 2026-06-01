import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet } from '../types';
import { MoneyAmount } from './MoneyAmount';
import { theme } from '../theme/theme';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: (wallet: Wallet) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: wallet.color || theme.colors.primary }]} 
      onPress={() => onPress?.(wallet)}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{wallet.name}</Text>
        <Text style={styles.type}>{wallet.type}</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <MoneyAmount 
          amount={wallet.balance} 
          currency={wallet.currency} 
          style={styles.balance} 
          colorType="auto"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 6,
    ...theme.shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.text, },
  type: { ...theme.typography.caption, color: theme.colors.textMuted,
    textTransform: 'uppercase', },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: { ...theme.typography.caption, color: theme.colors.textMuted, },
  balance: { ...theme.typography.h2, fontWeight: 'bold', },
});
