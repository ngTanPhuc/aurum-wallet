import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { SavingsDepositService } from '../services/SavingsDepositService';

type Props = NativeStackScreenProps<RootStackParamList, 'SavingsDepositDetail'>;

export const SavingsDepositDetailScreen = ({ route, navigation }: Props) => {
  const { depositId } = route.params;
  const { savingsDeposits, matureSavingsDeposit, closeSavingsDepositEarly } = useFinanceStore();
  const { settings } = useSettingsStore();

  const deposit = savingsDeposits.find(d => d.id === depositId);
  const wallets = useFinanceStore(state => state.wallets);
  const sourceWallet = wallets.find(w => w.id === deposit?.sourceWalletId);
  const payoutWallet = wallets.find(w => w.id === deposit?.payoutWalletId);

  if (!deposit) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Deposit Details" showBack={true} />
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Deposit not found</Text>
        </View>
      </View>
    );
  }

  const isMatured = SavingsDepositService.isDepositMatured(deposit);
  const daysRemaining = Math.max(0, Math.ceil((new Date(deposit.maturityDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

  const handleMature = () => {
    Alert.alert(
      'Confirm Maturity Payout',
      `This will return the principal of ${formatCurrency(deposit.principalAmount, settings.defaultCurrency)} and add interest of ${formatCurrency(deposit.expectedInterestAmount, settings.defaultCurrency)} to your ${payoutWallet?.name || 'Payout Wallet'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            await matureSavingsDeposit(deposit);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const handleCloseEarly = () => {
    Alert.alert(
      'Close Early',
      `Are you sure you want to close this deposit early? You will only receive the principal of ${formatCurrency(deposit.principalAmount, settings.defaultCurrency)}. You will forfeit the estimated interest.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Close Deposit', 
          style: 'destructive',
          onPress: async () => {
            await closeSavingsDepositEarly(deposit);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Deposit Details" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.headerCard}>
          <Text style={styles.depositName}>{deposit.name}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(deposit.principalAmount, settings.defaultCurrency)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deposit.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(deposit.status) }]}>{getStatusText(deposit.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <DetailRow label="Annual Interest Rate" value={`${deposit.annualInterestRate}% / yr`} />
          <DetailRow label="Term" value={`${deposit.termValue} ${deposit.termUnit}(s)`} />
          <DetailRow label="Expected Interest" value={`+${formatCurrency(deposit.expectedInterestAmount, settings.defaultCurrency)}`} valueColor={theme.colors.success} />
          <DetailRow label="Total Expected Payout" value={formatCurrency(deposit.expectedTotalPayout, settings.defaultCurrency)} valueColor={theme.colors.primary} />
          <DetailRow label="Interest Payout Type" value={deposit.interestPayoutType.replace('_', ' ')} style={{ textTransform: 'capitalize' }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <DetailRow label="Start Date" value={formatDate(deposit.startDate)} />
          <DetailRow label="Maturity Date" value={formatDate(deposit.maturityDate)} />
          {deposit.status === 'active' && (
            <DetailRow label="Days Remaining" value={daysRemaining > 0 ? `${daysRemaining} days` : 'Matured'} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallets</Text>
          <DetailRow label="Source Wallet" value={sourceWallet?.name || 'Unknown'} />
          <DetailRow label="Payout Wallet" value={payoutWallet?.name || 'Unknown'} />
        </View>

        {deposit.status === 'active' && isMatured && (
          <TouchableOpacity style={styles.matureButton} onPress={handleMature}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.background} />
            <Text style={styles.matureButtonText}>Confirm Maturity Payout</Text>
          </TouchableOpacity>
        )}

        {deposit.status === 'active' && !isMatured && (
          <TouchableOpacity style={styles.closeEarlyButton} onPress={handleCloseEarly}>
            <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
            <Text style={styles.closeEarlyText}>Close Early</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return theme.colors.primary;
    case 'matured': return theme.colors.success;
    case 'closed_early': return theme.colors.warning;
    case 'cancelled': return theme.colors.danger;
    default: return theme.colors.textMuted;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'matured': return 'Matured';
    case 'closed_early': return 'Closed Early';
    case 'cancelled': return 'Cancelled';
    default: return 'Unknown';
  }
};

const DetailRow = ({ label, value, valueColor, style }: { label: string, value: string, valueColor?: string, style?: any }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null, style]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.h3,
    color: theme.colors.danger,
  },
  headerCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  depositName: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  totalAmount: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.round,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  matureButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  matureButtonText: {
    ...theme.typography.body1,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  closeEarlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  closeEarlyText: {
    ...theme.typography.body1,
    color: theme.colors.danger,
    fontWeight: 'bold',
  }
});
