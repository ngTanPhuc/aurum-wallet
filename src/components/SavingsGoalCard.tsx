import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { SavingsGoal } from '../types';
import { MoneyAmount } from './MoneyAmount';
import { format, differenceInDays } from 'date-fns';
import { theme } from '../theme/theme';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = React.memo(({ goal }) => {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  
  let progressColor = goal.color || theme.colors.primary;
  if (goal.isCompleted || percentage >= 100) progressColor = theme.colors.success;

  let daysLeftText = '';
  if (goal.targetDate && !goal.isCompleted && percentage < 100) {
    const days = differenceInDays(new Date(goal.targetDate), new Date());
    if (days < 0) {
      daysLeftText = 'Overdue';
    } else if (days === 0) {
      daysLeftText = 'Due today';
    } else {
      daysLeftText = `${days} days left`;
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {(!goal.icon || /^[a-z0-9-]+$/.test(goal.icon)) ? (
            <Ionicons name={(goal.icon as any) || "flag"} size={28} color={theme.colors.textPrimary} style={styles.icon} />
          ) : (
            <Text style={[styles.icon, { fontSize: 24 }]}>{goal.icon}</Text>
          )}
          <Text style={styles.name}>{goal.name}</Text>
        </View>
        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.amounts}>
          <MoneyAmount amount={goal.currentAmount} style={styles.currentAmount} colorType="neutral" />
          <Text style={styles.separator}> / </Text>
          <MoneyAmount amount={goal.targetAmount} style={styles.targetAmount} colorType="neutral" />
        </View>
        {daysLeftText ? (
          <Text style={styles.daysLeft}>{daysLeftText}</Text>
        ) : (
          <Text style={styles.completedText}>{goal.isCompleted ? 'Goal Reached!' : ''}</Text>
        )}
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
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  name: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.textPrimary, },
  percentage: { ...theme.typography.body1, fontWeight: 'bold',
    color: theme.colors.primary, },
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
    alignItems: 'center',
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: { ...theme.typography.body2, fontWeight: 'bold',
    color: theme.colors.textPrimary, },
  separator: { ...theme.typography.body2, color: theme.colors.textMuted, },
  targetAmount: { ...theme.typography.caption, color: theme.colors.textMuted, },
  daysLeft: { ...theme.typography.caption, color: theme.colors.warning,
    fontWeight: '500', },
  completedText: { ...theme.typography.caption, color: theme.colors.success,
    fontWeight: 'bold', }
});
