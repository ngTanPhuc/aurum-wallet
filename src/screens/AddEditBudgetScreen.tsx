import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { MoneyAmount } from '../components/MoneyAmount';
import { CategoryPicker } from '../components/CategoryPicker';
import uuid from 'react-native-uuid';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditBudget'>;

export const AddEditBudgetScreen = ({ route, navigation }: Props) => {
  const { budgetId, month: initialMonth, year: initialYear } = route.params;
  
  const budgets = useFinanceStore(state => state.budgets);
  const addBudget = useFinanceStore(state => state.addBudget);
  const updateBudget = useFinanceStore(state => state.updateBudget);
  const deleteBudget = useFinanceStore(state => state.deleteBudget);
  const categories = useFinanceStore(state => state.categories);

  const isEditing = !!budgetId;
  const existingBudget = isEditing ? budgets.find(b => b.id === budgetId) : null;

  // Use a default month/year if not provided (fallback to current date)
  const defaultDate = new Date();
  const [month, setMonth] = useState(existingBudget?.month || initialMonth || defaultDate.getMonth() + 1);
  const [year, setYear] = useState(existingBudget?.year || initialYear || defaultDate.getFullYear());
  
  const [amount, setAmount] = useState(existingBudget?.amount?.toString() || '0');
  const [categoryId, setCategoryId] = useState(existingBudget?.categoryId || '');

  // We only allow budgeting for expenses
  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  const handleSave = async () => {
    const amountNum = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }

    if (!categoryId) {
      Alert.alert('Category Required', 'Please select a category for this budget.');
      return;
    }

    // Check if budget for this category and month already exists (and we aren't editing it)
    if (!isEditing) {
      const exists = budgets.some(b => b.categoryId === categoryId && b.month === month && b.year === year);
      if (exists) {
        Alert.alert('Duplicate Budget', 'A budget for this category already exists in this month.');
        return;
      }
    }

    try {
      if (isEditing && existingBudget) {
        await updateBudget({
          ...existingBudget,
          amount: amountNum,
          categoryId,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addBudget({
          id: uuid.v4() as string,
          categoryId,
          amount: amountNum,
          month,
          year,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save budget.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Budget', 'Are you sure you want to delete this budget?', [
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
    // Basic numeric filtering
    const cleanText = text.replace(/[^0-9]/g, '');
    setAmount(cleanText);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader title={isEditing ? 'Edit Budget' : 'New Budget'} showBack={true} />
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Budget Amount</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Target Category</Text>
        <CategoryPicker 
          typeFilter="expense"
          value={categoryId} 
          onChange={setCategoryId} 
        />
      </View>

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
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  formGroup: { marginBottom: theme.spacing.xl },
  label: { ...theme.typography.body1, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.sm },
  amountInput: { ...theme.typography.h1, fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md, },
  btnRow: { gap: 12, marginTop: theme.spacing.lg, marginBottom: 40 },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: 'bold', },
  deleteBtn: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.danger
  },
  deleteBtnText: { ...theme.typography.body1, color: theme.colors.danger,
    fontWeight: 'bold', }
});
