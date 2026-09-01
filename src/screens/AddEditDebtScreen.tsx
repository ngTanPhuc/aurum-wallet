import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, DebtDirection, InterestType, Debt, Transaction } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { AmountInput } from '../components/glass/AmountInput';
import { DebtService } from '../services/DebtService';
import uuid from 'react-native-uuid';
import { WalletPicker } from '../components/WalletPicker';
import { GlassSelect } from '../components/glass/GlassSelect';
import { appAlert } from '../components/glass/AppAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditDebt'>;

export const AddEditDebtScreen = ({ navigation, route }: Props) => {
  const { direction = 'lent' } = route.params || {};
  const { wallets, people, categories, addDebt } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const [personId, setPersonId] = useState<string>('');
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('none');
  const [interestRateStr, setInterestRateStr] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const [note, setNote] = useState('');

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setAmountStr('');
      return;
    }
    setAmountStr(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleInterestRateChange = (text: string) => {
    let val = text.replace(/[^0-9.]/g, '');
    if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
      val = val.replace(/^0+/, '');
    }
    setInterestRateStr(val);
  };

  // Default wallet
  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets]);

  // Live preview calculations
  const principal = parseFloat(amountStr.replace(/\./g, '')) || 0;
  const rate = parseFloat(interestRateStr) || 0;
  const startDate = new Date().toISOString();
  let dueDate = undefined;
  if (dueDateStr.trim()) {
    try {
      const d = new Date(dueDateStr);
      if (!isNaN(d.getTime())) dueDate = d.toISOString();
    } catch {}
  }

  const interestAmount = DebtService.calculateDebtInterest(principal, rate, interestType, startDate, dueDate);
  const totalExpected = DebtService.calculateTotalExpectedAmount(principal, interestAmount);

  const handleSave = async () => {
    if (!personId) return appAlert('Error', 'Please select a person.');
    if (principal <= 0) return appAlert('Error', 'Amount must be greater than 0.');
    if (!walletId) return appAlert('Error', 'Please select a wallet.');
    
    // Determine category
    const isLent = direction === 'lent';
    const txType = isLent ? 'expense' : 'income';
    const categoryName = isLent ? 'Lending' : 'Borrowed Money';
    const category = categories.find(c => c.name === categoryName && c.type === txType);

    const transactionId = uuid.v4() as string;
    const now = new Date().toISOString();

    const tx: Transaction = {
      id: transactionId,
      type: txType,
      amount: principal,
      fee: 0,
      sourceWalletId: walletId,
      categoryId: category?.id,
      note: `Debt: ${isLent ? 'Lent to' : 'Borrowed from'} ${people.find(p => p.id === personId)?.name || 'Someone'}`,
      transactionDate: now,
      createdAt: now,
      updatedAt: now
    };

    const debt: Debt = {
      id: uuid.v4() as string,
      personId,
      direction,
      principalAmount: principal,
      interestType,
      interestRate: rate,
      interestAmount,
      totalExpectedAmount: totalExpected,
      amountPaid: 0,
      remainingAmount: totalExpected,
      walletId,
      categoryId: category?.id,
      startDate: now,
      dueDate,
      status: 'active',
      note: note.trim(),
      openingTransactionId: transactionId,
      createdAt: now,
      updatedAt: now
    };

    try {
      await addDebt(debt, tx);
      navigation.goBack();
    } catch (e: any) {
      appAlert('Error', e.message || 'Failed to save debt.');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={direction === 'lent' ? 'I Lent Money' : 'I Borrowed Money'} showBack={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <GlassSelect
                label="Person"
                value={personId}
                onChange={setPersonId}
                placeholder="Select person..."
                options={people.map(p => ({ label: p.name, value: p.id }))}
              />
            </View>
            <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('AddEditPerson', {})}>
              <Ionicons name="add" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Amount ({defaultCurrency})</Text>
          <AmountInput
            style={styles.inputLarge}
            value={amountStr}
            onChangeText={handleAmountChange}
            placeholder="0"
          />

          <View style={{ marginTop: 16 }}>
            <WalletPicker
              label="From Wallet"
              value={walletId}
              onChange={setWalletId}
              requireSpendingEnabled={direction === 'lent'}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <GlassSelect
            label="Interest Type"
            value={interestType}
            onChange={(val) => setInterestType(val as InterestType)}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Flat Rate (%)', value: 'flat' },
              { label: 'Simple Annual (%)', value: 'simple_annual' },
            ]}
          />

          {interestType !== 'none' && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>Interest Rate (%)</Text>
              <AmountInput
                style={styles.input}
                value={interestRateStr}
                onChangeText={handleInterestRateChange}
                allowDecimal
                placeholder="e.g. 5"
                placeholderTextColor={theme.colors.textMuted}
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Due Date (Optional YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dueDateStr}
            onChangeText={setDueDateStr}
            placeholder="e.g. 2026-12-31"
            placeholderTextColor={theme.colors.textMuted}
          />
        </GlassCard>

        <GlassCard style={styles.previewCard}>
          <Text style={styles.previewTitle}>Live Preview</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Principal:</Text>
            <Text style={styles.previewValue}>{principal.toLocaleString()} {defaultCurrency}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Interest:</Text>
            <Text style={styles.previewValue}>{interestAmount.toLocaleString()} {defaultCurrency}</Text>
          </View>
          <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, marginTop: 4 }]}>
            <Text style={[styles.previewLabel, { fontWeight: 'bold', color: theme.colors.textPrimary }]}>Total Expected:</Text>
            <Text style={[styles.previewValue, { fontWeight: 'bold', color: theme.colors.textPrimary }]}>{totalExpected.toLocaleString()} {defaultCurrency}</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.colors.textMuted}
          />
        </GlassCard>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 8 },
  input: { ...theme.typography.body1, color: theme.colors.textPrimary, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  inputLarge: { ...theme.typography.h1, color: theme.colors.textPrimary, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, textAlign: 'center' },
  pickerContainer: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' },
  picker: { color: theme.colors.textPrimary, backgroundColor: 'transparent' },
  addBtn: { width: 48, height: 48, borderRadius: 8, backgroundColor: theme.colors.surfaceStrong, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  
  previewCard: { padding: 16, marginBottom: 16, backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.primary + '40' },
  previewTitle: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  previewLabel: { ...theme.typography.body2, color: theme.colors.textMuted },
  previewValue: { ...theme.typography.body2, color: theme.colors.textPrimary },
  
  saveBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { ...theme.typography.body1, color: '#fff', fontWeight: 'bold' }
});
