import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { GlobalFAB } from '../components/GlobalFAB';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RecurringTransactions'>;

export const RecurringTransactionsScreen = ({ navigation }: Props) => {
  const recurringTransactions = useFinanceStore(state => state.recurringTransactions);
  const wallets = useFinanceStore(state => state.wallets);
  const categories = useFinanceStore(state => state.categories);

  const getWalletName = (id: string) => wallets.find(w => w.id === id)?.name || 'Unknown Wallet';
  const getCategory = (id?: string) => categories.find(c => c.id === id);

  return (
    <View style={styles.container}>
      <CustomHeader title="Recurring" showBack={true} />
      <FlatList
        data={recurringTransactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const category = getCategory(item.categoryId);
          const isTransfer = item.type === 'transfer';
          const sign = item.type === 'expense' ? '-' : (item.type === 'income' ? '+' : '');
          const amountColor = item.type === 'expense' ? '#f44336' : (item.type === 'income' ? '#4caf50' : '#2196f3');
          const formattedAmount = item.amount.toLocaleString();

          return (
            <TouchableOpacity 
              style={[styles.card, !item.isActive && styles.inactiveCard]}
              onPress={() => navigation.navigate('AddEditRecurringTransaction', { recurringId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {(!category?.icon || /^[a-z0-9-]+$/.test(category.icon)) ? (
                    <Ionicons name={category?.icon as any || (isTransfer ? 'swap-horizontal' : 'wallet')} size={32} color={theme.colors.textPrimary} style={styles.icon} />
                  ) : (
                    <Text style={[styles.icon, { fontSize: 32 }]}>{category.icon}</Text>
                  )}
                  <View>
                    <Text style={styles.title}>{item.name || category?.name || (isTransfer ? 'Transfer' : 'Transaction')}</Text>
                    <Text style={styles.subtitle}>
                      {isTransfer 
                        ? `${getWalletName(item.walletId)} → ${getWalletName(item.destinationWalletId!)}`
                        : getWalletName(item.walletId)
                      }
                    </Text>
                  </View>
                </View>
                <Text style={[styles.amount, { color: amountColor }]}>{sign} {formattedAmount}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.frequency}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Next: {new Date(item.nextDueDate).toLocaleDateString()}</Text>
                </View>
                {!item.isActive && (
                  <View style={[styles.badge, { backgroundColor: '#ffebee' }]}>
                    <Text style={[styles.badgeText, { color: '#f44336' }]}>Paused</Text>
                  </View>
                )}
              </View>
              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Recurring Transactions</Text>
            <Text style={styles.emptyDesc}>Set up automated bills, subscriptions, or salaries here.</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddEditRecurringTransaction', {})}
            >
              <Text style={styles.createBtnText}>Create New</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  title: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.textPrimary, },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginTop: 2, },
  amount: { ...theme.typography.body1, fontWeight: 'bold', },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  note: { ...theme.typography.caption, marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic', },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm, },
  emptyDesc: { ...theme.typography.body2, color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20, },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.sm,
  },
  createBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: '600', }
});
