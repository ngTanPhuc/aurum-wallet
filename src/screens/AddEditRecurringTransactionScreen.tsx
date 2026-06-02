import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TransactionType, RecurringFrequency, RecurringTransaction } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { WalletPicker } from '../components/WalletPicker';
import { CategoryPicker } from '../components/CategoryPicker';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';


type Props = NativeStackScreenProps<RootStackParamList, 'AddEditRecurringTransaction'>;

export const AddEditRecurringTransactionScreen = ({ route, navigation }: Props) => {
  const { recurringId } = route.params || {};
  const isEditing = !!recurringId;

  const recurringTransactions = useFinanceStore(state => state.recurringTransactions);
  const addRecurringTransaction = useFinanceStore(state => state.addRecurringTransaction);
  const updateRecurringTransaction = useFinanceStore(state => state.updateRecurringTransaction);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [walletId, setWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  // Simplification for date: Using a simple YYYY-MM-DD input for now
  // A proper date picker (like @react-native-community/datetimepicker) should be used in production
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);
  const [isSubscription, setIsSubscription] = useState(false);

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setAmount('');
      return;
    }
    const formatted = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setAmount(formatted);
  };

  useEffect(() => {
    if (isEditing && recurringId) {
      const rt = recurringTransactions.find(t => t.id === recurringId);
      if (rt) {
        setName(rt.name);
        setType(rt.type);
        setAmount(rt.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        setFee((rt.fee && rt.amount) ? parseFloat(((rt.fee / rt.amount) * 100).toFixed(4)).toString() : '');
        setWalletId(rt.walletId);
        setDestinationWalletId(rt.destinationWalletId || '');
        setCategoryId(rt.categoryId || '');
        setNote(rt.note || '');
        setFrequency(rt.frequency);
        setStartDate(rt.startDate.split('T')[0]);
        setIsActive(rt.isActive);
        setIsSubscription(rt.isSubscription ?? false);
      }
    }
  }, [isEditing, recurringId, recurringTransactions]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    if (!walletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    const rawValue = amount.replace(/\./g, '');
    const amtNum = Math.abs(parseFloat(rawValue) || 0);

    const feePercentage = Math.abs(parseFloat(fee.replace(/,/g, '.')) || 0);
    const feeNum = amtNum > 0 ? (amtNum * feePercentage) / 100 : 0;
    
    if (type === 'transfer' && (!destinationWalletId || walletId === destinationWalletId)) {
      Alert.alert('Error', 'Please select a valid destination wallet');
      return;
    }
    if ((type === 'expense' || type === 'income') && !categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // Basic date validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }
    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Error', 'Invalid date');
      return;
    }
    // We store ISO strings
    const isoStartDate = parsedDate.toISOString();

    try {
      const rtData: Partial<RecurringTransaction> = {
        name,
        type,
        amount: amtNum,
        fee: feeNum,
        walletId,
        destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        note,
        frequency,
        startDate: isoStartDate,
        isActive,
        isSubscription,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && recurringId) {
        const rt = recurringTransactions.find(t => t.id === recurringId);
        if (rt) {
          // If start date changed and it's in the future, we might need to reset nextDueDate.
          // For simplicity, we just keep nextDueDate as is, or recalculate if the user changes it completely.
          // In a real app, changing start date should probably reset nextDueDate.
          let nextDue = rt.nextDueDate;
          if (rt.startDate !== isoStartDate) {
            nextDue = isoStartDate;
          }

          await updateRecurringTransaction({ 
            ...rt, 
            ...rtData as RecurringTransaction,
            nextDueDate: nextDue 
          });
        }
      } else {
        await addRecurringTransaction({
          ...rtData as RecurringTransaction,
          id: uuid.v4() as string,
          nextDueDate: isoStartDate, // First occurrence is on the start date
          createdAt: new Date().toISOString(),
        });
      }

      navigation.goBack();
    } catch (e: any) {
      console.error('Error saving recurring transaction:', e);
      Alert.alert('Error', e?.message || 'Failed to save recurring transaction');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader title={isEditing ? 'Edit Recurring' : 'New Recurring'} showBack={true} />
      </View>
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}>
        <View style={styles.typeSelector}>
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <TouchableOpacity 
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="e.g. Netflix, Rent, Salary" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Amount</Text>
        <AmountInput 
          style={styles.input} 
          value={amount} 
          onChangeText={handleAmountChange} 
           
          placeholder="0" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Fee (%) (optional)</Text>
        <TextInput 
          style={styles.input} 
          value={fee} 
          onChangeText={(text) => {
            const digitsOnly = text.replace(/\D/g, '');
            const trimmed = digitsOnly.replace(/^0+/, '');
            if (!trimmed) { setFee(''); return; }
            setFee(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
          }} 
          keyboardType="numeric" 
          placeholder="0" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <WalletPicker 
          label={type === 'income' ? 'To Wallet' : 'From Wallet'}
          value={walletId} 
          onChange={setWalletId} 
        />

        {type === 'transfer' && (
          <WalletPicker 
            label="To Wallet"
            value={destinationWalletId} 
            onChange={setDestinationWalletId} 
            excludeWalletId={walletId}
          />
        )}

        {(type === 'expense' || type === 'income') && (
          <CategoryPicker 
            value={categoryId} 
            onChange={setCategoryId} 
            typeFilter={type}
          />
        )}

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencySelector}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
        <TextInput 
          style={styles.input} 
          value={startDate} 
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {type === 'expense' && (
          <View style={styles.switchRow}>
            <Text style={styles.label}>Is this a subscription?</Text>
            <Switch value={isSubscription} onValueChange={setIsSubscription} />
          </View>
        )}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput 
          style={styles.input} 
          value={note} 
          onChangeText={setNote} 
          placeholder="e.g. Netflix Subscription" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Recurring'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.xl },
  typeBtn: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, alignItems: 'center' },
  typeBtnActive: { backgroundColor: theme.colors.primary },
  typeText: { color: theme.colors.textPrimary, textTransform: 'capitalize', fontWeight: '500' },
  typeTextActive: { color: theme.colors.background },
  frequencySelector: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  freqBtn: { flex: 1, padding: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, alignItems: 'center' },
  freqBtnActive: { backgroundColor: theme.colors.success },
  freqText: { ...theme.typography.caption, color: theme.colors.textPrimary, textTransform: 'capitalize', fontWeight: '500' },
  freqTextActive: { color: theme.colors.background },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: 40 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
