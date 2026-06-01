import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList, BottomTabParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { TransactionItem } from '../components/TransactionItem';
import { GlobalFAB } from '../components/GlobalFAB';
import { FilterModal } from '../components/FilterModal';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Transactions'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const TransactionsScreen = ({ navigation }: Props) => {
  const { 
    getFilteredTransactions, 
    transactionSearchQuery, 
    setTransactionSearchQuery,
    transactionFilters,
    transactions // to trigger re-renders
  } = useFinanceStore();

  const [filterVisible, setFilterVisible] = useState(false);

  const filteredTxs = getFilteredTransactions();
  
  const hasActiveFilters = Object.keys(transactionFilters).length > 0;

  return (
    <View style={styles.container}>
      <CustomHeader title="Transactions" />
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={theme.colors.textMuted}
          value={transactionSearchQuery}
          onChangeText={setTransactionSearchQuery}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          <Ionicons name={hasActiveFilters ? "filter" : "filter-outline"} size={20} color={hasActiveFilters ? theme.colors.primary : theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTxs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item} 
            onPress={(tx) => navigation.navigate('AddEditTransaction', { transactionId: tx.id })} 
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found.</Text>}
      />
      <GlobalFAB />
      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerRow: { flexDirection: 'row', padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.lg, paddingVertical: 10, borderRadius: theme.radii.round, fontSize: 16, marginRight: theme.spacing.md, color: theme.colors.text },
  filterBtn: { padding: theme.spacing.sm, backgroundColor: theme.colors.background, borderRadius: theme.radii.round },
  list: { padding: theme.spacing.lg },
  empty: { ...theme.typography.body1, textAlign: 'center', color: theme.colors.textMuted, marginTop: theme.spacing.xxl },
});
