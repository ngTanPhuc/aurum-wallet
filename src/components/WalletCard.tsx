import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet } from '../types';
import { MoneyAmount } from './MoneyAmount';
import { theme } from '../theme/theme';
import { useFinanceStore } from '../store/useFinanceStore';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: (wallet: Wallet) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, onPress }) => {
  const yieldPocketSettings = useFinanceStore(state => state.yieldPocketSettings);
  const hasYieldPocket = yieldPocketSettings.some(s => s.walletId === wallet.id);

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: wallet.color || theme.colors.primary }]} 
      onPress={() => onPress?.(wallet)}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{wallet.name}</Text>
          {hasYieldPocket && (
            <View style={styles.yieldBadge}>
              <Text style={styles.yieldBadgeText}>📈 Yield</Text>
            </View>
          )}
        </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yieldBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  yieldBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  name: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.textPrimary, },
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
