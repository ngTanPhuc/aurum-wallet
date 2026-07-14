import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, BudgetTargetType, BudgetRecurrence } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CategoryPicker } from '../components/CategoryPicker';
import { TagPicker } from '../components/TagPicker';
import uuid from 'react-native-uuid';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { GlassCard } from '../components/glass/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditBudget'>;

export const AddEditBudgetScreen = ({ route, navigation }: Props) => {
  const { budgetId } = route.params;
  
  const budgets = useFinanceStore(state => state.budgets);
  const addBudget = useFinanceStore(state => state.addBudget);
  const updateBudget = useFinanceStore(state => state.updateBudget);
  const deleteBudget = useFinanceStore(state => state.deleteBudget);
  const categories = useFinanceStore(state => state.categories);

  const isEditing = !!budgetId;
  const existingBudget = isEditing ? budgets.find(b => b.id === budgetId) : null;

  const [name, setName] = useState(existingBudget?.name || '');
  const [targetType, setTargetType] = useState<BudgetTargetType>(existingBudget?.targetType || 'category');
  const [targetId, setTargetId] = useState(existingBudget?.targetId || '');
  const [recurrence, setRecurrence] = useState<BudgetRecurrence>(existingBudget?.recurrence || 'monthly');
  
  const initialAmount = existingBudget?.amount 
    ? existingBudget.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : '';
  const [amount, setAmount] = useState(initialAmount);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (targetType === 'category' && expenseCategories.length > 0 && !targetId && !isEditing) {
      setTargetId(expenseCategories[0].id);
    }
  }, [targetType, expenseCategories, targetId, isEditing]);

  const handleSave = async () => {
    const amountNum = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      appAlert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }

    if (!name.trim()) {
      appAlert('Name Required', 'Please provide a name for this budget.');
      return;
    }

    if (!targetId) {
      appAlert('Target Required', 'Please select a category or tag.');
      return;
    }

    let finalStartDate = new Date();
    if (!isEditing) {
      if (recurrence === 'daily') finalStartDate = startOfDay(new Date());
      else if (recurrence === 'weekly') finalStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      else if (recurrence === 'monthly') finalStartDate = startOfMonth(new Date());
      else if (recurrence === 'yearly') finalStartDate = startOfYear(new Date());
    } else if (existingBudget) {
      finalStartDate = new Date(existingBudget.startDate);
    }
    const isoStartDate = finalStartDate.toISOString();

    try {
      if (isEditing && existingBudget) {
        await updateBudget({
          ...existingBudget,
          name: name.trim(),
          amount: amountNum,
          targetType,
          targetId,
          recurrence,
          startDate: isoStartDate,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addBudget({
          id: uuid.v4() as string,
          name: name.trim(),
          amount: amountNum,
          targetType,
          targetId,
          recurrence,
          startDate: isoStartDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      appAlert('Error', 'Failed to save budget.');
    }
  };

  const handleDelete = () => {
    appAlert('Delete Budget', 'Are you sure you want to delete this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (budgetId) {
          await deleteBudget(budgetId);
          navigation.goBack();
        }
      }}
    ]);
  };

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setAmount('');
      return;
    }
    setAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader title={isEditing ? 'Edit Budget' : 'New Budget'} showBack={true} />
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20} contentContainerStyle={styles.container}>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Budget Amount</Text>
        <AmountInput
          style={styles.amountInput}
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <GlassCard style={styles.formCard}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Monthly Groceries"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Type</Text>
          <View style={styles.pillContainer}>
            <TouchableOpacity 
              style={[styles.pillBtn, targetType === 'category' && styles.pillBtnActive]} 
              onPress={() => { setTargetType('category'); setTargetId(''); }}
            >
              <Text style={[styles.pillBtnText, targetType === 'category' && styles.pillBtnTextActive]}>Category</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pillBtn, targetType === 'tag' && styles.pillBtnActive]} 
              onPress={() => { setTargetType('tag'); setTargetId(''); }}
            >
              <Text style={[styles.pillBtnText, targetType === 'tag' && styles.pillBtnTextActive]}>Tag</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { zIndex: 10 }]}>
          {targetType === 'category' ? (
            <>
              <Text style={styles.label}>Target Category</Text>
              <CategoryPicker 
                typeFilter="expense"
                value={targetId} 
                onChange={setTargetId} 
              />
            </>
          ) : (
            <TagPicker
              selectedTagIds={targetId ? [targetId] : []}
              onChange={(ids) => setTargetId(ids.length > 0 ? ids[ids.length - 1] : '')}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Recurrence</Text>
          <View style={styles.pillContainer}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetRecurrence[]).map(r => (
              <TouchableOpacity 
                key={r}
                style={[styles.pillBtn, recurrence === r && styles.pillBtnActive]}
                onPress={() => setRecurrence(r)}
              >
                <Text style={[styles.pillBtnText, recurrence === r && styles.pillBtnTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </GlassCard>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Update Budget' : 'Save Budget'}</Text>
        </TouchableOpacity>
        
        {isEditing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, paddingBottom: 60 },
  amountContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
  amountLabel: {
    ...theme.typography.body1,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  amountInput: { 
    ...theme.typography.h1, 
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  formCard: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  formGroup: { marginBottom: theme.spacing.xl },
  label: { ...theme.typography.body1, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  textInput: { ...theme.typography.body1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: theme.radii.sm },
  pillBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radii.sm },
  pillBtnActive: { backgroundColor: theme.colors.surfaceStrong, ...theme.shadows.subtle },
  pillBtnText: { ...theme.typography.body2, color: theme.colors.textMuted, fontWeight: '600' },
  pillBtnTextActive: { color: theme.colors.textPrimary },
  btnRow: { gap: 12 },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.round,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
  deleteBtn: {
    backgroundColor: 'transparent',
    padding: theme.spacing.lg,
    borderRadius: theme.radii.round,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.danger
  },
  deleteBtnText: { ...theme.typography.body1, color: theme.colors.danger, fontWeight: 'bold' }
});
