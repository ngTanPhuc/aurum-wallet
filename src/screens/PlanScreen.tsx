import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, BottomTabParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Plan'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const PlanScreen = ({ navigation }: Props) => {
  const {
    budgets,
    savingsGoals,
    recurringTransactions,
    savingsDeposits,
    yieldPocketSettings,
    pendingRecurringTransactions,
    getBudgetProgress
  } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Budgets Summary
  const budgetSummary = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    budgets.forEach(b => {
      if (b.month === month && b.year === year) {
        const progress = getBudgetProgress(b.categoryId, month, year);
        totalBudgeted += progress.budgeted;
        totalSpent += progress.spent;
      }
    });
    const left = totalBudgeted - totalSpent;
    const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    return { left, percentage, activeCount: budgets.filter(b => b.month === month && b.year === year).length };
  }, [budgets, month, year, getBudgetProgress]);

  // Goals Summary
  const goalsSummary = useMemo(() => {
    const active = savingsGoals.filter(g => !g.isCompleted);
    return { activeCount: active.length };
  }, [savingsGoals]);

  // Subscriptions Summary
  const subsSummary = useMemo(() => {
    const subs = recurringTransactions.filter(r => r.isSubscription && r.isActive);
    const cost = subs.reduce((acc, curr) => acc + curr.amount, 0);
    return { activeCount: subs.length, totalCost: cost };
  }, [recurringTransactions]);

  // Recurring Summary
  const recurringSummary = useMemo(() => {
    const rtx = recurringTransactions.filter(r => !r.isSubscription && r.isActive);
    return { activeCount: rtx.length, pendingCount: pendingRecurringTransactions.length };
  }, [recurringTransactions, pendingRecurringTransactions]);

  // Growth Summary
  const depositsSummary = useMemo(() => {
    const active = savingsDeposits.filter(d => d.status === 'active');
    return { activeCount: active.length };
  }, [savingsDeposits]);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${defaultCurrency}`;
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Plan" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerArea}>
          <Text style={styles.subtitle}>Stay ahead of bills, budgets, and goals</Text>
        </View>

        <GlassCard variant="strong" style={styles.thisMonthCard}>
          <Text style={styles.thisMonthTitle}>This Month's Outlook</Text>
          <View style={styles.outlookMainRow}>
            <View>
              <Text style={styles.outlookMainLabel}>Budget Left</Text>
              <Text style={styles.outlookMainValue}>{formatCurrency(Math.max(0, budgetSummary.left))}</Text>
            </View>
            <Ionicons name="wallet" size={36} color={theme.colors.primary} style={{ opacity: 0.8 }} />
          </View>
          
          <View style={styles.outlookDivider} />
          
          <View style={styles.outlookSubRow}>
            <View style={styles.outlookSubItem}>
              <Ionicons name="alert-circle-outline" size={18} color={theme.colors.warning} />
              <Text style={styles.outlookSubText}>{recurringSummary.pendingCount} Pending Bills</Text>
            </View>
            <View style={styles.outlookSubItem}>
              <Ionicons name="flag-outline" size={18} color={theme.colors.success} />
              <Text style={styles.outlookSubText}>{goalsSummary.activeCount} Active Goals</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>Planning Tools</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Budgets')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="flag" size={24} color={theme.colors.primary} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Budgets</Text>
              <Text style={styles.tileDesc}>
                {budgetSummary.activeCount > 0 
                  ? `${budgetSummary.percentage.toFixed(0)}% used · ${formatCurrency(Math.max(0, budgetSummary.left))} left` 
                  : 'No active budgets'}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SavingsGoals')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="wallet" size={24} color={theme.colors.success} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Goals</Text>
              <Text style={styles.tileDesc}>
                {goalsSummary.activeCount > 0 ? `${goalsSummary.activeCount} active goals` : 'Set a goal'}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Subscriptions')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="swap-horizontal" size={24} color={theme.colors.info} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Subscriptions</Text>
              <Text style={styles.tileDesc}>
                {subsSummary.activeCount > 0 ? `${formatCurrency(subsSummary.totalCost)} / month` : 'No subscriptions'}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('RecurringTransactions')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="repeat" size={24} color={theme.colors.warning} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Recurring</Text>
              <Text style={styles.tileDesc}>
                {recurringSummary.activeCount > 0 ? `${recurringSummary.activeCount} active items` : 'Automate your bills'}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Grow Money</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SavingsDeposits')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="business" size={24} color={theme.colors.success} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Bank Savings</Text>
              <Text style={styles.tileDesc}>
                {depositsSummary.activeCount > 0 ? `${depositsSummary.activeCount} active deposits` : 'Lock money for yield'}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Wallets')}>
            <GlassCard style={styles.tileCard}>
              <Ionicons name="trending-up" size={24} color={theme.colors.primary} style={styles.tileIcon} />
              <Text style={styles.tileTitle}>Yield Pockets</Text>
              <Text style={styles.tileDesc}>
                {yieldPocketSettings.length > 0 ? `${yieldPocketSettings.length} active pockets` : 'Flexible daily yield'}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {pendingRecurringTransactions.length > 0 && (
          <View style={styles.dueSoonSection}>
            <Text style={styles.sectionTitle}>Due Soon</Text>
            {pendingRecurringTransactions.slice(0, 3).map(rt => (
              <GlassCard key={rt.id} style={styles.dueItemCard}>
                <View style={styles.dueItemLeft}>
                  <View style={styles.dueItemIconContainer}>
                    <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />
                  </View>
                  <View>
                    <Text style={styles.dueItemName}>{rt.name}</Text>
                    <Text style={styles.dueItemDate}>Due: {new Date(rt.nextDueDate).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.dueItemAmount}>{formatCurrency(rt.amount)}</Text>
              </GlassCard>
            ))}
            {pendingRecurringTransactions.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('PendingRecurring')} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All Pending</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  headerArea: { marginBottom: 20, paddingHorizontal: 4 },
  subtitle: { ...theme.typography.body1, color: theme.colors.textMuted },
  
  thisMonthCard: { marginBottom: 24, padding: 20 },
  thisMonthTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 16 },
  outlookMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  outlookMainLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 4 },
  outlookMainValue: { ...theme.typography.h1, color: theme.colors.textPrimary },
  outlookDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16 },
  outlookSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  outlookSubItem: { flexDirection: 'row', alignItems: 'center' },
  outlookSubText: { ...theme.typography.body2, color: theme.colors.textPrimary, marginLeft: 8 },
  
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 12, marginTop: 8, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridItem: { width: '48%', marginBottom: 12 },
  tileCard: { padding: 16, height: 120, justifyContent: 'center' },
  tileIcon: { marginBottom: 12 },
  tileTitle: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  tileDesc: { ...theme.typography.body2, color: theme.colors.textMuted, fontSize: 12 },
  
  dueSoonSection: { marginTop: 8 },
  dueItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 8 },
  dueItemLeft: { flexDirection: 'row', alignItems: 'center' },
  dueItemIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.warningBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dueItemName: { ...theme.typography.body1, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
  dueItemDate: { ...theme.typography.body2, color: theme.colors.textMuted, fontSize: 12 },
  dueItemAmount: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  viewAllBtn: { alignItems: 'center', marginTop: 8, padding: 12 },
  viewAllText: { ...theme.typography.body2, color: theme.colors.primary, fontWeight: 'bold' },
});
