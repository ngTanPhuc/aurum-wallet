import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { BudgetProgressCard } from '../components/BudgetProgressCard';
import { format, addMonths, subMonths } from 'date-fns';
import { GlobalFAB } from '../components/GlobalFAB';
import { useFocusEffect } from '@react-navigation/native';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Budgets'>;

export const BudgetsScreen = ({ navigation }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const budgets = useFinanceStore(state => state.budgets);
  const loadBudgetsForMonth = useFinanceStore(state => state.loadBudgetsForMonth);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Load budgets whenever the month changes
  useFocusEffect(
    useCallback(() => {
      loadBudgetsForMonth(month, year);
    }, [month, year, loadBudgetsForMonth])
  );

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  return (
    <View style={styles.container}>
      <CustomHeader title="Monthly Budgets" />
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('AddEditBudget', { budgetId: item.id })}>
            <BudgetProgressCard budget={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Budgets Set</Text>
            <Text style={styles.emptyDesc}>Create a budget to start tracking your spending for {format(currentDate, 'MMMM yyyy')}.</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddEditBudget', { month, year })}
            >
              <Text style={styles.createBtnText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  arrowBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  arrowText: { ...theme.typography.h2, color: theme.colors.primary, },
  monthText: { ...theme.typography.h3, color: theme.colors.text, },
  list: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 40,
  },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.text,
    marginBottom: theme.spacing.sm, },
  emptyDesc: { ...theme.typography.body1, color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24, },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.sm,
  },
  createBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: 'bold', }
});
