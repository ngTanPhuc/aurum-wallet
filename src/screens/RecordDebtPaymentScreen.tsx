import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, DebtPayment, Transaction, Debt } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordDebtPayment'>;

export const RecordDebtPaymentScreen = ({ navigation, route }: Props) => {
  const { debtId } = route.params;
  const { debts, wallets, categories, recordDebtPayment } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const debt = debts.find(d => d.id === debtId);
  
  const [amountStr, setAmountStr] = useState(debt ? debt.remainingAmount.toString() : '');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets]);

  if (!debt) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Debt Not Found" showBack={true} />
      </View>
    );
  }

  const isLent = debt.direction === 'lent';

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Please enter a valid amount.');
    if (amount > debt.remainingAmount) return Alert.alert('Error', `Amount cannot exceed remaining balance (${debt.remainingAmount}).`);
    if (!walletId) return Alert.alert('Error', 'Please select a wallet.');

    const now = new Date().toISOString();
    const transactionId = uuid.v4() as string;

    // For Lent debt (someone owes us): They repay -> Income.
    // For Borrowed debt (we owe someone): We repay -> Expense.
    const txType = isLent ? 'income' : 'expense';
    const categoryName = isLent ? 'Debt Repayment' : 'Debt Payment';
    const category = categories.find(c => c.name === categoryName && c.type === txType);

    const tx: Transaction = {
      id: transactionId,
      type: txType,
      amount,
      fee: 0,
      sourceWalletId: walletId,
      categoryId: category?.id,
      note: note.trim() || `Payment for debt`,
      transactionDate: now,
      createdAt: now,
      updatedAt: now
    };

    const payment: DebtPayment = {
      id: uuid.v4() as string,
      debtId,
      walletId,
      amount,
      paymentDate: now,
      note: note.trim(),
      transactionId,
      createdAt: now,
      updatedAt: now
    };

    const newAmountPaid = debt.amountPaid + amount;
    const newRemaining = Math.max(0, debt.totalExpectedAmount - newAmountPaid);
    let newStatus = debt.status;
    if (newRemaining === 0) newStatus = 'paid';
    else if (newAmountPaid > 0) newStatus = 'partially_paid';

    const updatedDebt: Debt = {
      ...debt,
      amountPaid: newAmountPaid,
      remainingAmount: newRemaining,
      status: newStatus,
      updatedAt: now
    };

    try {
      await recordDebtPayment(payment, tx, updatedDebt);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record payment.');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={isLent ? 'Record Repayment Received' : 'Record Repayment Paid'} showBack={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Amount ({defaultCurrency})</Text>
          <TextInput
            style={styles.inputLarge}
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.helperText}>Remaining balance: {debt.remainingAmount.toLocaleString()} {defaultCurrency}</Text>

          <Text style={[styles.label, { marginTop: 24 }]}>{isLent ? 'To Wallet' : 'From Wallet'}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={walletId}
              onValueChange={setWalletId}
              dropdownIconColor={theme.colors.textPrimary}
              style={styles.picker}
            >
              {wallets.map(w => (
                <Picker.Item key={w.id} label={`${w.name} (${w.balance})`} value={w.id} color={theme.colors.textPrimary} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.colors.textMuted}
          />
        </GlassCard>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Payment</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 8 },
  helperText: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center', fontSize: 12 },
  input: { ...theme.typography.body1, color: theme.colors.textPrimary, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  inputLarge: { ...theme.typography.h1, color: theme.colors.textPrimary, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' },
  picker: { color: theme.colors.textPrimary, backgroundColor: 'transparent' },
  
  saveBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { ...theme.typography.body1, color: '#fff', fontWeight: 'bold' }
});
