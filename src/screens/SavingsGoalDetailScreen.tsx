import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { SavingsGoalCard } from '../components/SavingsGoalCard';
import { WalletPicker } from '../components/WalletPicker';
import uuid from 'react-native-uuid';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SavingsGoalDetail'>;

export const SavingsGoalDetailScreen = ({ route, navigation }: Props) => {
  const { goalId } = route.params;
  const store = useFinanceStore();
  const goal = store.transactions ? store.savingsGoals.find(g => g.id === goalId) : null;
  const goalTransactions = store.transactions.filter(t => t.savingsGoalId === goalId && t.type === 'expense');

  let requiredMonthly = 0;
  let monthsRemaining = 0;
  if (goal?.targetDate) {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    monthsRemaining = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
    if (monthsRemaining <= 0) monthsRemaining = 1; // Prevent division by zero, assume this month
    requiredMonthly = Math.max(0, goal.targetAmount - goal.currentAmount) / monthsRemaining;
  }

  // Calculate average monthly savings based on past transactions
  let averageMonthlySavings = 0;
  let projectedDate: Date | null = null;
  if (goalTransactions.length > 0) {
    const sortedDates = goalTransactions.map(t => new Date(t.transactionDate).getTime()).sort((a, b) => a - b);
    const firstTxDate = new Date(sortedDates[0]);
    const now = new Date();
    let monthsElapsed = (now.getFullYear() - firstTxDate.getFullYear()) * 12 + (now.getMonth() - firstTxDate.getMonth());
    if (monthsElapsed <= 0) monthsElapsed = 1;
    
    const totalSaved = goalTransactions.reduce((sum, t) => sum + t.amount, 0);
    averageMonthlySavings = totalSaved / monthsElapsed;

    if (averageMonthlySavings > 0 && goal) {
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
      const monthsToComplete = Math.ceil(remainingAmount / averageMonthlySavings);
      projectedDate = new Date(now);
      projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);
    }
  }

  const [adjustAmount, setAdjustAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');

  const defaultWallet = store.wallets.find(w => w.includeInTotal && !w.isArchived) || store.wallets[0];
  useEffect(() => {
    if (!selectedWalletId && defaultWallet) {
      setSelectedWalletId(defaultWallet.id);
    }
  }, [defaultWallet]);

  // No longer needed to set navigation options directly if using CustomHeader
  // But we will use the CustomHeader rightAction

  if (!goal) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Goal Not Found" showBack={true} />
        <Text style={{ padding: theme.spacing.lg, color: theme.colors.text }}>Goal not found.</Text>
      </View>
    );
  }

  const handleAdjustChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setAdjustAmount('');
      return;
    }
    setAdjustAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleAdjust = async (type: 'add' | 'subtract') => {
    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet first.');
      return;
    }

    const adjRaw = adjustAmount.replace(/\./g, '');
    const adj = Math.abs(parseFloat(adjRaw) || 0);
    if (adj <= 0) return;

    if (type === 'subtract' && adj > goal.currentAmount) {
      Alert.alert('Error', 'Cannot subtract more than the current goal amount.');
      return;
    }

    const txType = type === 'add' ? 'expense' : 'income';

    const newTx = {
      id: uuid.v4() as string,
      type: txType,
      amount: adj,
      sourceWalletId: selectedWalletId,
      savingsGoalId: goal.id,
      note: type === 'add' ? `Contribution to ${goal.name}` : `Withdrawal from ${goal.name}`,
      transactionDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    try {
      await store.addTransaction(newTx as any);
      setAdjustAmount('');
      Alert.alert('Success', `Funds successfully ${type === 'add' ? 'added to' : 'subtracted from'} your goal.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to manage funds.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader 
          title="Goal Details" 
          showBack={true}
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('AddEditSavingsGoal', { goalId })}>
              <Text style={styles.headerBtn}>Edit</Text>
            </TouchableOpacity>
          }
        />
      </View>
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
      <View style={{ marginBottom: 24, pointerEvents: 'none' }}>
        <SavingsGoalCard goal={goal} />
      </View>

      <View style={[styles.card, { marginBottom: 16 }]}>
        <Text style={styles.cardTitle}>Goal Insights</Text>
        
        {goal.targetDate ? (
          <View style={styles.insightRow}>
            <View style={styles.insightIconContainer}><Text style={styles.insightIcon}>🎯</Text></View>
            <View style={styles.insightTextContainer}>
              <Text style={styles.insightLabel}>Required Monthly Savings</Text>
              <Text style={styles.insightValue}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requiredMonthly)}
              </Text>
              <Text style={styles.insightSub}>to reach goal by {new Date(goal.targetDate).toLocaleDateString()}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.insightSub}>Set a target date to see required monthly savings.</Text>
        )}

        <View style={styles.divider} />

        {projectedDate ? (
          <View style={styles.insightRow}>
            <View style={styles.insightIconContainer}><Text style={styles.insightIcon}>📈</Text></View>
            <View style={styles.insightTextContainer}>
              <Text style={styles.insightLabel}>Projected Completion</Text>
              <Text style={styles.insightValue}>
                {projectedDate.toLocaleDateString()}
              </Text>
              <Text style={styles.insightSub}>based on your average savings of {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(averageMonthlySavings)}/month</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.insightSub}>Not enough data to project completion date.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage Funds</Text>
        <Text style={styles.cardDesc}>Enter an amount below to manually add or subtract from your current progress.</Text>
        
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={adjustAmount}
          onChangeText={handleAdjustChange}
        />

        <View style={{ marginBottom: 20 }}>
          <WalletPicker
            label="Select Wallet"
            value={selectedWalletId}
            onChange={setSelectedWalletId}
          />
        </View>
        
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.adjustBtnAdd} onPress={() => handleAdjust('add')}>
            <Text style={styles.adjustBtnText}>+ Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adjustBtnSub} onPress={() => handleAdjust('subtract')}>
            <Text style={styles.adjustBtnText}>- Subtract</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  headerBtn: { ...theme.typography.body1, color: theme.colors.primary,
    fontWeight: '600', },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.subtle,
  },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text,
    marginBottom: theme.spacing.sm, },
  cardDesc: { ...theme.typography.body2, color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
    lineHeight: 20, },
  label: { ...theme.typography.body2, fontWeight: '600',
    color: theme.colors.text, },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightLabel: { ...theme.typography.caption, color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2, },
  insightValue: { ...theme.typography.h3, color: theme.colors.text,
    marginBottom: 2, },
  insightSub: { ...theme.typography.caption, color: theme.colors.textMuted, },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    fontSize: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  adjustBtnAdd: {
    flex: 1,
    backgroundColor: theme.colors.success,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  adjustBtnSub: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  adjustBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: 'bold', }
});
