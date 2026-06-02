import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TransactionType, TransactionTemplate } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { WalletPicker } from '../components/WalletPicker';
import { CategoryPicker } from '../components/CategoryPicker';
import { TagPicker } from '../components/TagPicker';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';


type Props = NativeStackScreenProps<RootStackParamList, 'AddEditTransaction'>;

export const AddTransactionScreen = ({ route, navigation }: Props) => {
  const { transactionId, type: initialType, savingsGoalId: initialGoalId } = route.params || {};
  const isEditing = !!transactionId;

  const transactions = useFinanceStore(state => state.transactions);
  const savingsGoals = useFinanceStore(state => state.savingsGoals);
  const addTransaction = useFinanceStore(state => state.addTransaction);
  const updateTransaction = useFinanceStore(state => state.updateTransaction);
  const templates = useFinanceStore(state => state.templates);
  const addTemplate = useFinanceStore(state => state.addTemplate);

  const [type, setType] = useState<TransactionType>(initialType || 'expense');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [savingsGoalId, setSavingsGoalId] = useState(initialGoalId || '');
  const [note, setNote] = useState('');

  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const tags = useFinanceStore(state => state.tags);

  const targetGoal = savingsGoals.find(g => g.id === savingsGoalId);

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

  const handleApplyTemplate = (template: TransactionTemplate) => {
    setType(template.type);
    setAmount(template.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    setFee((template.fee && template.amount) ? parseFloat(((template.fee / template.amount) * 100).toFixed(4)).toString() : '');
    setSourceWalletId(template.walletId);
    setCategoryId(template.categoryId || '');
    setNote(template.note || '');
  };

  useEffect(() => {
    if (isEditing && transactionId) {
      const tx = transactions.find(t => t.id === transactionId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        setFee((tx.fee && tx.amount) ? parseFloat(((tx.fee / tx.amount) * 100).toFixed(4)).toString() : '');
        setSourceWalletId(tx.sourceWalletId);
        setDestinationWalletId(tx.destinationWalletId || '');
        setCategoryId(tx.categoryId || '');
        setNote(tx.note || '');
        if (tx.tags) {
          setTagIds(tx.tags.map(t => t.id));
        }
      }
    }
  }, [isEditing, transactionId, transactions]);

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    if (!sourceWalletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    // Parse out the dots for the raw number
    const rawValue = amount.replace(/\./g, '');
    const amtNum = Math.abs(parseFloat(rawValue) || 0);

    const feePercentage = Math.abs(parseFloat(fee.replace(/,/g, '.')) || 0);
    const feeNum = amtNum > 0 ? (amtNum * feePercentage) / 100 : 0;
    
    if (type === 'transfer' && (!destinationWalletId || sourceWalletId === destinationWalletId)) {
      Alert.alert('Error', 'Please select a valid destination wallet');
      return;
    }
    if ((type === 'expense' || type === 'income') && !categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      const txData = {
        type,
        amount: amtNum,
        fee: feeNum,
        sourceWalletId,
        destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        savingsGoalId: savingsGoalId || undefined,
        note,
        tags: tags.filter(t => tagIds.includes(t.id)),
        transactionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && transactionId) {
        const tx = transactions.find(t => t.id === transactionId);
        if (tx) {
          await updateTransaction({ ...tx, ...txData });
        }
      } else {
        await addTransaction({
          ...txData,
          id: uuid.v4() as string,
          createdAt: new Date().toISOString(),
        });
      }

      if (saveAsTemplate && templateName.trim()) {
        await addTemplate({
          name: templateName.trim(),
          type,
          amount: amtNum,
          fee: feeNum,
          walletId: sourceWalletId,
          categoryId: type !== 'transfer' ? categoryId : undefined,
          note,
        });
      }

      navigation.goBack();
    } catch (e: any) {
      console.error('Error saving transaction:', e);
      Alert.alert('Error', e?.message || 'Failed to save transaction');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader title={isEditing ? 'Edit Transaction' : 'New Transaction'} showBack={true} />
      </View>
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}>
        {targetGoal && (
          <View style={styles.goalBanner}>
            <Text style={styles.goalBannerText}>Funding Goal: {targetGoal.name}</Text>
          </View>
        )}

        {!isEditing && templates.length > 0 && (
          <View style={styles.templatesContainer}>
            <Text style={styles.label}>Quick Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
              {templates.map(t => (
                <TouchableOpacity key={t.id} style={styles.templatePill} onPress={() => handleApplyTemplate(t)}>
                  <Text style={styles.templatePillText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
          value={sourceWalletId} 
          onChange={setSourceWalletId} 
        />

        {type === 'transfer' && (
          <WalletPicker 
            label="To Wallet"
            value={destinationWalletId} 
            onChange={setDestinationWalletId} 
            excludeWalletId={sourceWalletId}
          />
        )}

        {(type === 'expense' || type === 'income') && (
          <CategoryPicker 
            value={categoryId} 
            onChange={setCategoryId} 
            typeFilter={type}
          />
        )}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput 
          style={styles.input} 
          value={note} 
          onChangeText={setNote} 
          placeholder="What was this for?" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />

        {!isEditing && (
          <View style={styles.saveTemplateContainer}>
            <View style={styles.saveTemplateRow}>
              <Text style={styles.label}>Save as Template</Text>
              <Switch testID="save-template-switch" value={saveAsTemplate} onValueChange={setSaveAsTemplate} />
            </View>
            {saveAsTemplate && (
              <TextInput
                style={styles.input}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Template Name (e.g., Morning Coffee)"
                placeholderTextColor={theme.colors.textMuted}
              />
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save Transaction'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  goalBanner: { backgroundColor: theme.colors.surfaceStrong, padding: theme.spacing.md, borderRadius: theme.radii.sm, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.primary },
  goalBannerText: { color: theme.colors.primary, fontWeight: 'bold', textAlign: 'center' },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.xl },
  typeBtn: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, alignItems: 'center' },
  typeBtnActive: { backgroundColor: theme.colors.primary },
  typeText: { color: theme.colors.textPrimary, textTransform: 'capitalize', fontWeight: '500' },
  typeTextActive: { color: theme.colors.background },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  saveTemplateContainer: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.radii.sm, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border },
  saveTemplateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  templatesContainer: { marginBottom: theme.spacing.lg },
  templatesScroll: { flexDirection: 'row' },
  templatePill: { backgroundColor: theme.colors.surfaceStrong, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.round, marginRight: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.primary },
  templatePillText: { color: theme.colors.primary, fontWeight: '500' },
  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: 40 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
