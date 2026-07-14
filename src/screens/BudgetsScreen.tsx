import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { BudgetProgressCard } from '../components/BudgetProgressCard';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { GlobalFAB } from '../components/GlobalFAB';
import { useFocusEffect } from '@react-navigation/native';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { BudgetSummaryRing } from '../components/BudgetSummaryRing';

type Props = NativeStackScreenProps<RootStackParamList, 'Budgets'>;

export const BudgetsScreen = ({ navigation }: Props) => {
  const budgets = useFinanceStore(state => state.budgets);
  const loadBudgets = useFinanceStore(state => state.loadBudgets);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [loadBudgets])
  );

  const { sections, targetDateIso } = useMemo(() => {
    const today = new Date();
    const iso = today.toISOString();
    
    const daily = budgets.filter(b => b.recurrence === 'daily');
    const weekly = budgets.filter(b => b.recurrence === 'weekly');
    const monthly = budgets.filter(b => b.recurrence === 'monthly');
    const yearly = budgets.filter(b => b.recurrence === 'yearly');

    const result = [];
    if (daily.length > 0) {
      result.push({ title: 'Today', data: daily });
    }
    if (weekly.length > 0) {
      const wStart = startOfWeek(today, { weekStartsOn: 1 });
      const wEnd = endOfWeek(today, { weekStartsOn: 1 });
      result.push({ title: `This week (${format(wStart, 'd MMMM')} to ${format(wEnd, 'd MMMM')})`, data: weekly });
    }
    if (monthly.length > 0) {
      result.push({ title: `This ${format(today, 'MMMM')}`, data: monthly });
    }
    if (yearly.length > 0) {
      result.push({ title: `This ${format(today, 'yyyy')}`, data: yearly });
    }
    return { sections: result, targetDateIso: iso };
  }, [budgets]);

  return (
    <View style={styles.container}>
      <CustomHeader title="Budgets" showBack={true} />
      
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          budgets.length > 0 ? (
            <BudgetSummaryRing budgets={budgets} targetDate={targetDateIso} />
          ) : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddEditBudget', { budgetId: item.id })}
            style={styles.cardWrapper}
          >
            <BudgetProgressCard budget={item} targetDate={targetDateIso} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="pie-chart-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Budgets Yet</Text>
            <Text style={styles.emptyDesc}>Create a recurring budget to start keeping your spending in check.</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddEditBudget', {})}
            >
              <Ionicons name="add" size={20} color={theme.colors.background} />
              <Text style={styles.createBtnText}>New Budget</Text>
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
  list: { paddingBottom: 100 },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  sectionHeaderText: {
    ...theme.typography.h3,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  cardWrapper: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: theme.spacing.xl,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, fontWeight: 'bold' },
  emptyDesc: { ...theme.typography.body1, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: 24 },
  createBtn: { 
    flexDirection: 'row',
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: theme.spacing.xl, 
    paddingVertical: theme.spacing.lg, 
    borderRadius: theme.radii.round,
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.medium,
  },
  createBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
