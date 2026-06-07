import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { SavingsDepositCard } from '../components/SavingsDepositCard';
import { GlobalFAB } from '../components/GlobalFAB';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SavingsDeposits'>;

export const SavingsDepositsScreen = ({ navigation }: Props) => {
  const savingsDeposits = useFinanceStore(state => state.savingsDeposits);

  return (
    <View style={styles.container}>
      <CustomHeader title="Savings Deposits" />
      <FlatList
        data={savingsDeposits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('SavingsDepositDetail', { depositId: item.id })}>
            <SavingsDepositCard deposit={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Savings Deposits</Text>
            <Text style={styles.emptyDesc}>Track your traditional bank savings and fixed-term deposits here.</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddEditSavingsDeposit', {})}
            >
              <Text style={styles.createBtnText}>Add Deposit</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity 
        style={[styles.createBtn, { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center', alignItems: 'center' }]} 
        onPress={() => navigation.navigate('AddEditSavingsDeposit', {})}
      >
        <Ionicons name="add" size={32} color={theme.colors.background} />
      </TouchableOpacity>
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
  emptyTitle: { 
    ...theme.typography.h2, 
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm, 
  },
  emptyDesc: { 
    ...theme.typography.body2, 
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20, 
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.sm,
  },
  createBtnText: { 
    ...theme.typography.body1, 
    color: theme.colors.background,
    fontWeight: '600', 
  }
});
