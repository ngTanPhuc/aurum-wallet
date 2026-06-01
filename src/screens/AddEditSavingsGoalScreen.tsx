import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SavingsGoal } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditSavingsGoal'>;

const ICONS = ['🎯', '🏝️', '🚗', '💻', '🏠', '🎁', '🎓', '💍', '🎮'];
const COLORS = ['#007bff', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];

export const AddEditSavingsGoalScreen = ({ route, navigation }: Props) => {
  const { goalId } = route.params;
  const store = useFinanceStore();
  const existingGoal = goalId ? store.savingsGoals.find(g => g.id === goalId) : null;

  const [name, setName] = useState(existingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(existingGoal ? existingGoal.targetAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
  const [currentAmount, setCurrentAmount] = useState(existingGoal ? existingGoal.currentAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
  const [icon, setIcon] = useState(existingGoal?.icon || ICONS[0]);
  const [color, setColor] = useState(existingGoal?.color || COLORS[0]);
  const [targetDate, setTargetDate] = useState<Date | null>(existingGoal?.targetDate ? new Date(existingGoal.targetDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTargetChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setTargetAmount('');
      return;
    }
    setTargetAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleCurrentChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setCurrentAmount('');
      return;
    }
    setCurrentAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }
    
    const tRaw = targetAmount.replace(/\./g, '');
    const tAmount = Math.abs(parseFloat(tRaw) || 0);
    if (tAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }
    
    const cRaw = currentAmount.replace(/\./g, '');
    const cAmount = Math.abs(parseFloat(cRaw) || 0);

    const goal: SavingsGoal = {
      id: existingGoal ? existingGoal.id : uuid.v4() as string,
      name: name.trim(),
      targetAmount: tAmount,
      currentAmount: cAmount,
      targetDate: targetDate ? targetDate.toISOString() : undefined,
      icon,
      color,
      isCompleted: cAmount >= tAmount,
      createdAt: existingGoal ? existingGoal.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingGoal) {
      await store.updateSavingsGoal(goal);
    } else {
      await store.addSavingsGoal(goal);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    if (existingGoal) {
      Alert.alert('Delete Goal', 'Are you sure you want to delete this savings goal?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await store.deleteSavingsGoal(existingGoal.id);
            navigation.goBack();
          }
        }
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader title={existingGoal ? 'Edit Goal' : 'New Goal'} showBack={true} />
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Goal Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Vacation to Japan"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Target Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={handleTargetChange}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Starting/Current Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={currentAmount}
          onChangeText={handleCurrentChange}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Target Date (Optional)</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ ...theme.typography.body1, color: targetDate ? theme.colors.text : theme.colors.textMuted }}>
            {targetDate ? targetDate.toLocaleDateString() : 'Select a target date...'}
          </Text>
        </TouchableOpacity>
        {targetDate && (
          <TouchableOpacity onPress={() => setTargetDate(null)}>
            <Text style={{ color: '#ff3b30', marginTop: 8, fontSize: 14 }}>Clear Date</Text>
          </TouchableOpacity>
        )}
        
        {showDatePicker && (
          <DateTimePicker
            value={targetDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setTargetDate(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.selectionRow}>
          {ICONS.map(i => (
            <TouchableOpacity 
              key={i} 
              style={[styles.iconBtn, icon === i && styles.selectedIconBtn]}
              onPress={() => setIcon(i)}
            >
              <Text style={styles.iconText}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.selectionRow}>
          {COLORS.map(c => (
            <TouchableOpacity 
              key={c} 
              style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.selectedColorBtn]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Goal</Text>
      </TouchableOpacity>

      {existingGoal && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Goal</Text>
        </TouchableOpacity>
      )}
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
  label: { ...theme.typography.body2, fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm, },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border, },
  hint: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginTop: 4, },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedIconBtn: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  iconText: {
    fontSize: 24,
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorBtn: {
    borderColor: theme.colors.text,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: 'bold', },
  deleteBtn: {
    backgroundColor: theme.colors.background,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  deleteBtnText: { ...theme.typography.body1, color: theme.colors.danger,
    fontWeight: 'bold', },
  addFundsBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 14,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  addFundsBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: 'bold', }
});
