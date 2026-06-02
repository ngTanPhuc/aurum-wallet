import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TransactionType } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { WalletPicker } from '../components/WalletPicker';
import { CategoryPicker } from '../components/CategoryPicker';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';


type Props = NativeStackScreenProps<RootStackParamList, 'AddEditTemplate'>;

export const AddEditTemplateScreen = ({ route, navigation }: Props) => {
  const { templateId } = route.params || {};
  const isEditing = !!templateId;

  const templates = useFinanceStore(state => state.templates);
  const addTemplate = useFinanceStore(state => state.addTemplate);
  const updateTemplate = useFinanceStore(state => state.updateTemplate);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

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
    if (isEditing && templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setName(template.name);
        setType(template.type);
        setAmount(template.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        setFee((template.fee && template.amount) ? parseFloat(((template.fee / template.amount) * 100).toFixed(4)).toString() : '');
        setSourceWalletId(template.walletId);
        setCategoryId(template.categoryId || '');
        setNote(template.note || '');
      }
    }
  }, [isEditing, templateId, templates]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a template name.');
      return;
    }
    
    if (!amount) {
      Alert.alert('Validation Error', 'Please enter an amount.');
      return;
    }
    
    if (!sourceWalletId) {
      Alert.alert('Validation Error', 'Please select a wallet.');
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    const amtNum = parseInt(amount.replace(/\./g, ''), 10);
    const feePercentage = Math.abs(parseFloat(fee.replace(/,/g, '.')) || 0);
    const feeNum = amtNum > 0 ? (amtNum * feePercentage) / 100 : 0;

    try {
      if (isEditing && templateId) {
        const existing = templates.find(t => t.id === templateId);
        if (existing) {
          await updateTemplate({
            ...existing,
            name: name.trim(),
            type,
            amount: amtNum,
            fee: feeNum,
            walletId: sourceWalletId,
            categoryId: type !== 'transfer' ? categoryId : undefined,
            note,
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        await addTemplate({
          name: name.trim(),
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
      console.error('Error saving template:', e);
      Alert.alert('Error', 'Could not save template.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader title={isEditing ? 'Edit Template' : 'New Template'} showBack={true} />
      </View>
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  contentContainerStyle={styles.scroll}>
        
        <Text style={styles.label}>Template Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="e.g., Morning Coffee" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <View style={styles.typeSelector}>
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <TouchableOpacity 
              key={t} 
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount</Text>
        <AmountInput 
          style={[styles.input, { fontSize: 24, fontWeight: 'bold' }]} 
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
          label={type === 'transfer' ? 'From Wallet' : 'Wallet'}
          value={sourceWalletId} 
          onChange={setSourceWalletId} 
        />

        {type !== 'transfer' && (
          <CategoryPicker 
            value={categoryId} 
            onChange={setCategoryId} 
            typeFilter={type === 'income' ? 'income' : 'expense'} 
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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save Template'}</Text>
        </TouchableOpacity>
        
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg },
  typeSelector: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, padding: 4, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: theme.colors.background, ...theme.shadows.subtle },
  typeText: { ...theme.typography.body2, fontWeight: '600', color: theme.colors.textMuted },
  typeTextActive: { color: theme.colors.primary },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: 40 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
