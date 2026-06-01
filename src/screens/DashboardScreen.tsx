import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionItem } from '../components/TransactionItem';
import { GlobalFAB } from '../components/GlobalFAB';
import { MetricCard } from '../components/MetricCard';
import { InsightCard } from '../components/InsightCard';
import { SavingsGoalCard } from '../components/SavingsGoalCard';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const DashboardScreen = ({ navigation }: Props) => {
  const { 
    getTotalBalance, 
    transactions, 
    savingsGoals,
    pendingRecurringTransactions,
    getSavingsRate,
    getCashFlow,
    getLargestSpendingCategory,
    getInsights
  } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);
  
  const balance = getTotalBalance();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Basic Stats
  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // New Metrics
  const savingsRate = getSavingsRate(currentMonth, currentYear);
  const cashFlow = getCashFlow(currentMonth, currentYear);
  const largestCategory = getLargestSpendingCategory(currentMonth, currentYear);
  
  // Smart Insights (Top 3)
  const insights = useMemo(() => getInsights().slice(0, 3), [transactions, getInsights]);

  // Active Goals (Top 1)
  const activeGoal = savingsGoals.filter(g => !g.isCompleted)[0];

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${defaultCurrency}`;
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Dashboard" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {pendingRecurringTransactions.length > 0 && (
          <TouchableOpacity 
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('PendingRecurring')}
          >
            <View style={styles.pendingBannerContent}>
              <Text style={styles.pendingIcon}>⚠️</Text>
              <View>
                <Text style={styles.pendingTitle}>Pending Transactions</Text>
                <Text style={styles.pendingDesc}>You have {pendingRecurringTransactions.length} recurring transaction(s) due.</Text>
              </View>
            </View>
            <Text style={styles.pendingArrow}>➔</Text>
          </TouchableOpacity>
        )}

        <View style={styles.cardsRow}>
          <SummaryCard title="Total Balance" amount={balance} type="balance" currency={defaultCurrency} />
        </View>
        <View style={styles.cardsRow}>
          <SummaryCard title="Monthly Income" amount={income} type="income" currency={defaultCurrency} />
          <SummaryCard title="Monthly Expense" amount={expense} type="expense" currency={defaultCurrency} />
        </View>

        {/* Dashboard Metrics Horizontal Scroll */}
        <View style={styles.metricsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScrollContent}>
            <MetricCard 
              title="Savings Rate" 
              value={`${savingsRate.rate.toFixed(1)}%`} 
              icon="💰" 
              color={theme.colors.success}

              subtitle={`${Math.abs(savingsRate.trend).toFixed(1)}% vs last month`}
              trend={savingsRate.trend >= 0 ? 'up' : 'down'}
            />
            <MetricCard 
              title="Cash Flow" 
              value={formatCurrency(cashFlow.net)} 
              icon={cashFlow.isPositive ? '📈' : '📉'} 
              color={cashFlow.isPositive ? theme.colors.info : theme.colors.danger}
              subtitle={cashFlow.isPositive ? 'Positive cash flow' : 'Negative cash flow'}
            />
            {largestCategory && (
              <MetricCard 
                title="Top Expense" 
                value={largestCategory.categoryName} 
                icon="🔥" 
                color={theme.colors.warning}
                subtitle={`${largestCategory.percentage.toFixed(1)}% of spending`}
              />
            )}
          </ScrollView>
        </View>

        {/* Smart Insights Section */}
        {insights.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Smart Insights</Text>
            {insights.map(insight => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onActionPress={(route) => navigation.navigate(route as any)} 
              />
            ))}
          </View>
        )}

        {/* Goal Summary */}
        {activeGoal && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Goal</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SavingsGoals')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SavingsGoalDetail', { goalId: activeGoal.id })}>
              <SavingsGoalCard goal={activeGoal} />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map(item => (
                <TransactionItem 
                  key={item.id}
                  transaction={item} 
                  onPress={(tx) => navigation.navigate('AddEditTransaction', { transactionId: tx.id })} 
                />
              ))
            ) : (
              <Text style={styles.empty}>No transactions yet.</Text>
            )}
          </View>
        </View>
        
        {/* Padding for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 20, paddingTop: 20 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
  
  metricsContainer: {
    marginVertical: 12,
  },
  metricsScrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 12, // Added to prevent shadow clipping
    paddingTop: 4,
  },
  
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 12 },
  seeAll: { ...theme.typography.body2, color: theme.colors.primary, fontWeight: '500' },
  
  listContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  empty: { textAlign: 'center', color: theme.colors.textMuted, padding: 20 },
  
  pendingBanner: { backgroundColor: theme.colors.warningBg, marginHorizontal: 16, marginBottom: 16, borderRadius: theme.radii.md, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.warning },
  pendingBannerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pendingIcon: { fontSize: 24, marginRight: 12 },
  pendingTitle: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.warning },
  pendingDesc: { ...theme.typography.body2, color: theme.colors.warning, marginTop: 2, paddingRight: 8 },
  pendingArrow: { fontSize: 18, color: theme.colors.warning, fontWeight: 'bold' },
});
