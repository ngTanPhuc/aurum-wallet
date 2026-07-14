import React, { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SavingsDeposit, SavingsDepositTermUnit, SavingsDepositInterestPayoutType } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';
import { SavingsDepositService } from '../services/SavingsDepositService';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditSavingsDeposit'>;

export const AddEditSavingsDepositScreen = ({ route, navigation }: Props) => {
  const { depositId } = route.params;
  const store = useFinanceStore();
  const existingDeposit = depositId ? store.savingsDeposits.find(d => d.id === depositId) : null;
  const wallets = store.wallets.filter(w => !w.isArchived);

  const [name, setName] = useState(existingDeposit?.name || '');
  const [principalAmount, setPrincipalAmount] = useState(existingDeposit ? existingDeposit.principalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
  const [sourceWalletId, setSourceWalletId] = useState(existingDeposit?.sourceWalletId || wallets[0]?.id || '');
  const [payoutWalletId, setPayoutWalletId] = useState(existingDeposit?.payoutWalletId || wallets[0]?.id || '');
  const [annualInterestRate, setAnnualInterestRate] = useState(existingDeposit?.annualInterestRate.toString() || '');
  const [termValue, setTermValue] = useState(existingDeposit?.termValue.toString() || '1');
  const [termUnit, setTermUnit] = useState<SavingsDepositTermUnit>(existingDeposit?.termUnit || 'month');
  const [payoutType, setPayoutType] = useState<SavingsDepositInterestPayoutType>(existingDeposit?.interestPayoutType || 'at_maturity');

  const handlePrincipalChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setPrincipalAmount('');
      return;
    }
    setPrincipalAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      appAlert('Error', 'Please enter a name');
      return;
    }
    
    const pRaw = principalAmount.replace(/\./g, '');
    const pAmount = Math.abs(parseFloat(pRaw) || 0);
    if (pAmount <= 0) {
      appAlert('Error', 'Please enter a valid principal amount');
      return;
    }

    const rate = parseFloat(annualInterestRate);
    if (isNaN(rate) || rate <= 0) {
      appAlert('Error', 'Please enter a valid interest rate');
      return;
    }

    const term = parseInt(termValue, 10);
    if (isNaN(term) || term <= 0) {
      appAlert('Error', 'Please enter a valid term length');
      return;
    }

    if (!sourceWalletId || !payoutWalletId) {
      appAlert('Error', 'Please select source and payout wallets');
      return;
    }

    // Check if source wallet has enough balance if new
    if (!existingDeposit) {
      const sourceWallet = wallets.find(w => w.id === sourceWalletId);
      if (sourceWallet && sourceWallet.balance < pAmount) {
        appAlert('Insufficient Funds', 'The source wallet does not have enough balance for this deposit.');
        return;
      }
    }

    const startDate = existingDeposit ? existingDeposit.startDate : new Date().toISOString();
    const maturityDate = SavingsDepositService.calculateMaturityDate(startDate, term, termUnit);
    const expectedInterest = SavingsDepositService.calculateSimpleInterest(pAmount, rate, startDate, maturityDate);

    const deposit: SavingsDeposit = {
      id: existingDeposit ? existingDeposit.id : uuid.v4() as string,
      name: name.trim(),
      sourceWalletId,
      payoutWalletId,
      principalAmount: pAmount,
      annualInterestRate: rate,
      termValue: term,
      termUnit,
      startDate,
      maturityDate,
      interestPayoutType: payoutType,
      expectedInterestAmount: expectedInterest,
      expectedTotalPayout: pAmount + expectedInterest,
      status: existingDeposit ? existingDeposit.status : 'active',
      createdAt: existingDeposit ? existingDeposit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingDeposit) {
      await store.updateSavingsDeposit(deposit);
    } else {
      await store.addSavingsDeposit(deposit);
    }

    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader title={existingDeposit ? 'Edit Deposit' : 'New Deposit'} showBack={true} />
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20} style={styles.container}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Deposit Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 6-Month Term Deposit"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!existingDeposit} // Only allow changing name if not active? Actually let's allow editing name always.
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Principal Amount</Text>
          <AmountInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            value={principalAmount}
            onChangeText={handlePrincipalChange}
            editable={!existingDeposit} // Cannot change amount once created
          />
        </View>

        {!existingDeposit && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Source Wallet (To deduct from)</Text>
            <View style={styles.selectionRow}>
              {wallets.map(w => (
                <TouchableOpacity
                  key={`source-${w.id}`}
                  style={[styles.chip, sourceWalletId === w.id && styles.selectedChip]}
                  onPress={() => setSourceWalletId(w.id)}
                >
                  <Text style={[styles.chipText, sourceWalletId === w.id && styles.selectedChipText]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Payout Wallet (Upon maturity)</Text>
          <View style={styles.selectionRow}>
            {wallets.map(w => (
              <TouchableOpacity
                key={`payout-${w.id}`}
                style={[styles.chip, payoutWalletId === w.id && styles.selectedChip]}
                onPress={() => setPayoutWalletId(w.id)}
              >
                <Text style={[styles.chipText, payoutWalletId === w.id && styles.selectedChipText]}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Interest Rate (% / yr)</Text>
            <AmountInput
              style={styles.input}
              placeholder="5.5"
              placeholderTextColor={theme.colors.textMuted}
              value={annualInterestRate}
              onChangeText={setAnnualInterestRate}
              allowDecimal
              editable={!existingDeposit}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Term Length</Text>
            <AmountInput
              style={styles.input}
              placeholder="6"
              placeholderTextColor={theme.colors.textMuted}
              value={termValue}
              onChangeText={setTermValue}
              editable={!existingDeposit}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Term Unit</Text>
          <View style={styles.selectionRow}>
            {(['day', 'month', 'year'] as SavingsDepositTermUnit[]).map(unit => (
              <TouchableOpacity
                key={unit}
                style={[styles.chip, termUnit === unit && styles.selectedChip]}
                onPress={() => !existingDeposit && setTermUnit(unit)}
              >
                <Text style={[styles.chipText, termUnit === unit && styles.selectedChipText, { textTransform: 'capitalize' }]}>{unit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Payout Type</Text>
          <View style={styles.selectionRow}>
            {(['at_maturity', 'monthly', 'upfront'] as SavingsDepositInterestPayoutType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, payoutType === type && styles.selectedChip]}
                onPress={() => !existingDeposit && setPayoutType(type)}
              >
                <Text style={[styles.chipText, payoutType === type && styles.selectedChipText, { textTransform: 'capitalize' }]}>
                  {type.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{existingDeposit ? 'Update Details' : 'Create Deposit'}</Text>
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  label: { 
    ...theme.typography.body2, 
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm, 
  },
  input: { 
    ...theme.typography.body1, 
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border, 
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
  },
  selectedChipText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  saveBtnText: { 
    ...theme.typography.body1, 
    color: theme.colors.background,
    fontWeight: 'bold', 
  }
});
