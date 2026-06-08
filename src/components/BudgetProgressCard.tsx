import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Budget } from '../types';
import { MoneyAmount } from './MoneyAmount';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';

interface BudgetProgressCardProps {
  budget: Budget;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = React.memo(({ budget }) => {
  const transactions = useFinanceStore(state => state.transactions);
  const categories = useFinanceStore(state => state.categories);
  
  const category = categories.find(c => c.id === budget.categoryId);
  
  // Calculate spent amount for this budget
  const spent = React.useMemo(() => {
    return transactions
      .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
      .filter(t => {
        const d = new Date(t.transactionDate);
        return d.getMonth() + 1 === budget.month && d.getFullYear() === budget.year;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, budget]);

  const percentage = Math.min((spent / budget.amount) * 100, 100);
  
  let progressColor = theme.colors.success;
  if (percentage >= 100) progressColor = theme.colors.danger;
  else if (percentage >= 80) progressColor = theme.colors.warning;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.categoryName}>{category?.name || 'Unknown'}</Text>
        <MoneyAmount amount={budget.amount} style={styles.budgetAmount} colorType="neutral" />
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.spentText}>
          Spent: <MoneyAmount amount={spent} style={styles.spentAmount} colorType="neutral" />
        </Text>
        <Text style={styles.remainingText}>
          Left: <MoneyAmount amount={budget.amount - spent} style={styles.remainingAmount} colorType={budget.amount - spent < 0 ? 'negative' : 'positive'} />
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryName: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.textPrimary, },
  budgetAmount: { ...theme.typography.body1, fontWeight: 'bold',
    color: theme.colors.textMuted, },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: { ...theme.typography.caption, color: theme.colors.textMuted, },
  spentAmount: { ...theme.typography.caption, fontWeight: '600', },
  remainingText: { ...theme.typography.caption, color: theme.colors.textMuted, },
  remainingAmount: { ...theme.typography.caption, fontWeight: '600', },
});
