import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RecurringTransaction } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { MoneyAmount } from '../components/MoneyAmount';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscriptions'>;

export const SubscriptionsScreen = ({ navigation }: Props) => {
  const recurringTransactions = useFinanceStore(state => state.recurringTransactions);
  const wallets = useFinanceStore(state => state.wallets);
  const categories = useFinanceStore(state => state.categories);
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const subscriptions = recurringTransactions.filter(rt => rt.isSubscription);

  // Calculate monthly and yearly costs
  let monthlyCost = 0;
  let yearlyCost = 0;

  subscriptions.forEach(sub => {
    if (sub.type !== 'expense') return; // subscriptions are usually expenses
    const amount = sub.amount;
    switch (sub.frequency) {
      case 'daily':
        monthlyCost += amount * 30;
        yearlyCost += amount * 365;
        break;
      case 'weekly':
        monthlyCost += amount * 4.33;
        yearlyCost += amount * 52;
        break;
      case 'monthly':
        monthlyCost += amount;
        yearlyCost += amount * 12;
        break;
      case 'yearly':
        monthlyCost += amount / 12;
        yearlyCost += amount;
        break;
    }
  });

  const renderItem = ({ item }: { item: RecurringTransaction }) => {
    const wallet = wallets.find(w => w.id === item.walletId);
    const category = categories.find(c => c.id === item.categoryId);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('AddEditRecurringTransaction', { recurringId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <MoneyAmount 
            amount={item.amount} 
            currency={wallet?.currency || defaultCurrency} 
            style={[styles.cardAmount, { color: item.type === 'expense' ? '#f44336' : '#4caf50' }]}
          />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>
            Billing: {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
          </Text>
          <Text style={styles.detailText}>
            Next Date: {new Date(item.nextDueDate).toLocaleDateString()}
          </Text>
          <Text style={styles.detailText}>
            Wallet: {wallet?.name || 'Unknown'}
          </Text>
          {category && (
            <Text style={styles.detailText}>
              Category: {category.name}
            </Text>
          )}
        </View>
        {!item.isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inactive</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Subscriptions" showBack={true} />
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Monthly Cost</Text>
          <MoneyAmount amount={monthlyCost} currency={defaultCurrency} style={styles.summaryValue} />
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Yearly Cost</Text>
          <MoneyAmount amount={yearlyCost} currency={defaultCurrency} style={styles.summaryValue} />
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Active Subscriptions ({subscriptions.length})</Text>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔄</Text>
            <Text style={styles.emptyStateText}>No subscriptions found.</Text>
            <Text style={styles.emptyStateSub}>Mark recurring expenses as subscriptions to track them here.</Text>
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditRecurringTransaction', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderBottomLeftRadius: theme.radii.xl,
    borderBottomRightRadius: theme.radii.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: theme.spacing.sm, },
  summaryValue: { ...theme.typography.h2, color: theme.colors.primary,
    fontWeight: 'bold', },
  listContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  listTitle: { ...theme.typography.h3, color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg, },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: { ...theme.typography.body1, fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1, },
  cardAmount: { ...theme.typography.body1, fontWeight: 'bold', },
  cardDetails: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radii.sm,
  },
  detailText: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginBottom: 4, },
  inactiveBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.round,
  },
  inactiveText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
  },
  emptyStateText: { ...theme.typography.h3, color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm, },
  emptyStateSub: { ...theme.typography.body2, color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32, },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  fabText: {
    color: theme.colors.background,
    fontSize: 32,
    marginTop: -4,
  },
});
