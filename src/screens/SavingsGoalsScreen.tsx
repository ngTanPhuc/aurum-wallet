import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { SavingsGoalCard } from '../components/SavingsGoalCard';
import { GlobalFAB } from '../components/GlobalFAB';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SavingsGoals'>;

export const SavingsGoalsScreen = ({ navigation }: Props) => {
  const savingsGoals = useFinanceStore(state => state.savingsGoals);

  return (
    <View style={styles.container}>
      <CustomHeader title="Savings Goals" />
      <FlatList
        data={savingsGoals}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('SavingsGoalDetail', { goalId: item.id })}>
            <SavingsGoalCard goal={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Savings Goals Yet</Text>
            <Text style={styles.emptyDesc}>Set a target to save for a vacation, emergency fund, or a new gadget!</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddEditSavingsGoal', {})}
            >
              <Text style={styles.createBtnText}>Create a Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.text,
    marginBottom: theme.spacing.sm, },
  emptyDesc: { ...theme.typography.body2, color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20, },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.sm,
  },
  createBtnText: { ...theme.typography.body1, color: theme.colors.background,
    fontWeight: '600', }
});
