import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Budget } from '../types';
import { MoneyAmount } from './MoneyAmount';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';
import { GlassCard } from './glass/GlassCard';

interface BudgetProgressCardProps {
  budget: Budget;
  targetDate: string;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = React.memo(({ budget, targetDate }) => {
  const getBudgetProgress = useFinanceStore(state => state.getBudgetProgress);
  const transactions = useFinanceStore(state => state.transactions);
  
  const progress = React.useMemo(() => {
    return getBudgetProgress(budget.id, targetDate);
  }, [getBudgetProgress, budget.id, targetDate, transactions]);

  const { spent, budgeted, remaining, percentage } = progress;
  
  let progressColor = theme.colors.success;
  if (percentage >= 100) progressColor = theme.colors.danger;
  else if (percentage >= 80) progressColor = theme.colors.warning;
  else if (percentage > 0) progressColor = theme.colors.primary;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.categoryName}>{budget.name || 'Unknown'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{budget.recurrence}</Text>
            </View>
          </View>
          <Text style={styles.budgetAmountLabel}>Total Budget</Text>
        </View>
        <MoneyAmount amount={budgeted} style={styles.budgetAmount} colorType="neutral" />
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>
      
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Spent</Text>
          <MoneyAmount amount={spent} style={styles.spentAmount} colorType="neutral" />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>Left</Text>
          <MoneyAmount amount={remaining} style={styles.remainingAmount} colorType={remaining < 0 ? 'negative' : 'positive'} />
        </View>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryName: { 
    ...theme.typography.h3, 
    fontWeight: 'bold',
    color: theme.colors.textPrimary, 
  },
  badge: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  budgetAmountLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  budgetAmount: { 
    ...theme.typography.h3, 
    fontWeight: 'bold',
    color: theme.colors.textPrimary, 
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: { 
    ...theme.typography.caption, 
    color: theme.colors.textMuted, 
    marginBottom: 2,
  },
  spentAmount: { 
    ...theme.typography.body1, 
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  remainingAmount: { 
    ...theme.typography.body1, 
    fontWeight: 'bold', 
  },
});
