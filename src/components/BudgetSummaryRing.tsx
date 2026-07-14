import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Budget } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CircularProgress } from './glass/CircularProgress';
import { theme } from '../theme/theme';
import { MoneyAmount } from './MoneyAmount';
import { GlassCard } from './glass/GlassCard';

interface Props {
  budgets: Budget[];
  targetDate: string;
}

export const BudgetSummaryRing = ({ budgets, targetDate }: Props) => {
  const getBudgetProgress = useFinanceStore(state => state.getBudgetProgress);
  const transactions = useFinanceStore(state => state.transactions);

  const summary = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    budgets.forEach(b => {
      const progress = getBudgetProgress(b.id, targetDate);
      totalBudgeted += progress.budgeted;
      totalSpent += progress.spent;
    });
    
    const percentage = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
    const remaining = totalBudgeted - totalSpent;
    
    let ringColor = theme.colors.success;
    if (percentage >= 100) ringColor = theme.colors.danger;
    else if (percentage >= 80) ringColor = theme.colors.warning;
    else if (percentage > 0) ringColor = theme.colors.primary;

    return { totalBudgeted, totalSpent, remaining, percentage, ringColor };
  }, [budgets, targetDate, getBudgetProgress, transactions]);

  if (budgets.length === 0) return null;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.ringContainer}>
          <CircularProgress 
            percentage={summary.percentage} 
            radius={70} 
            strokeWidth={14} 
            color={summary.ringColor}
            backgroundColor="rgba(255,255,255,0.05)"
          >
            <Text style={styles.percentageText}>{Math.round(summary.percentage)}%</Text>
            <Text style={styles.spentLabel}>Spent</Text>
          </CircularProgress>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: theme.colors.textMuted }]} />
            <View>
              <Text style={styles.statLabel}>Budgeted</Text>
              <MoneyAmount amount={summary.totalBudgeted} style={styles.statValue} colorType="neutral" />
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: summary.ringColor }]} />
            <View>
              <Text style={styles.statLabel}>Remaining</Text>
              <MoneyAmount amount={summary.remaining} style={styles.statValue} colorType={summary.remaining < 0 ? 'negative' : 'positive'} />
            </View>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  ringContainer: {
    marginRight: theme.spacing.xl,
  },
  percentageText: {
    ...theme.typography.h2,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  spentLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statValue: {
    ...theme.typography.body1,
    fontWeight: 'bold',
  }
});
