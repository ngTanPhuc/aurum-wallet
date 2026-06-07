import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SavingsDeposit } from '../types';
import { theme } from '../theme/theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';

interface Props {
  deposit: SavingsDeposit;
}

export const SavingsDepositCard = ({ deposit }: Props) => {
  const { settings } = useSettingsStore();

  const getStatusColor = () => {
    switch (deposit.status) {
      case 'active': return theme.colors.primary;
      case 'matured': return theme.colors.success;
      case 'closed_early': return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  };

  const getStatusText = () => {
    switch (deposit.status) {
      case 'active': return 'Active';
      case 'matured': return 'Matured';
      case 'closed_early': return 'Closed Early';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="business" size={20} color={theme.colors.primary} />
          <Text style={styles.title}>{deposit.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Principal</Text>
          <Text style={styles.value}>{formatCurrency(deposit.principalAmount, settings.defaultCurrency)}</Text>
        </View>
        <View style={[styles.column, { alignItems: 'flex-end' }]}>
          <Text style={styles.label}>Rate</Text>
          <Text style={styles.value}>{deposit.annualInterestRate}% / yr</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Maturity Date</Text>
          <Text style={styles.dateText}>{formatDate(deposit.maturityDate)}</Text>
        </View>
        <View style={[styles.column, { alignItems: 'flex-end' }]}>
          <Text style={styles.label}>Expected Return</Text>
          <Text style={[styles.value, { color: theme.colors.success }]}>
            +{formatCurrency(deposit.expectedInterestAmount, settings.defaultCurrency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  column: {
    flex: 1,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  value: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  dateText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  }
});
