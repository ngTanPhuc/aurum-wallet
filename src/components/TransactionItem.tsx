import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { MoneyAmount } from './MoneyAmount';
import { format } from 'date-fns';
import { theme } from '../theme/theme';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const wallets = useFinanceStore(state => state.wallets);
  const categories = useFinanceStore(state => state.categories);

  const sourceWallet = wallets.find(w => w.id === transaction.sourceWalletId);
  const destinationWallet = wallets.find(w => w.id === transaction.destinationWalletId);
  const category = categories.find(c => c.id === transaction.categoryId);

  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const getIcon = () => {
    if (isTransfer) return 'swap-horizontal';
    return category?.icon || (isExpense ? 'cash-outline' : 'wallet-outline');
  };

  const getTitle = () => {
    if (isTransfer) {
      return `Transfer to ${destinationWallet?.name || 'Unknown'}`;
    }
    return category?.name || transaction.type;
  };

  const getSubtitle = () => {
    let parts = [format(new Date(transaction.transactionDate), 'MMM dd, yyyy')];
    if (sourceWallet) {
      parts.push(sourceWallet.name);
    }
    if (transaction.note) {
      parts.push(transaction.note);
    }
    return parts.join(' • ');
  };

  const getAmountColorType = () => {
    if (isExpense) return 'negative';
    if (isIncome) return 'positive';
    return 'neutral';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(transaction)}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: category?.color || theme.colors.surfaceStrong }]}>
        {(!getIcon() || /^[a-z0-9-]+$/.test(getIcon())) ? (
          <Ionicons name={getIcon() as any} size={24} color={theme.colors.textPrimary} />
        ) : (
          <Text style={{ fontSize: 24 }}>{getIcon()}</Text>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{getTitle()}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{getSubtitle()}</Text>
        {transaction.tags && transaction.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {transaction.tags.map(tag => (
              <View key={tag.id} style={[styles.tagBadge, { backgroundColor: tag.color || '#007bff' }]}>
                <Text style={styles.tagText}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <MoneyAmount 
          amount={transaction.amount}
          currency={sourceWallet?.currency}
          colorType={getAmountColorType()}
          showSign={true}
          style={styles.amount}
        />
        {(transaction.fee || 0) > 0 && (
          <Text style={styles.feeText}>
            + Fee: {transaction.fee?.toLocaleString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.subtle,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { ...theme.typography.body1, fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize', },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted, },
  amount: { ...theme.typography.body1, fontWeight: 'bold',
    marginLeft: theme.spacing.lg, },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.sm },
  tagText: { ...theme.typography.caption, color: theme.colors.background, fontWeight: 'bold' },
  feeText: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
});
