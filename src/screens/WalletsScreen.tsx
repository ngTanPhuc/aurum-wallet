import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList, BottomTabParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { WalletCard } from '../components/WalletCard';
import { GlobalFAB } from '../components/GlobalFAB';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Wallets'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const WalletsScreen = ({ navigation }: Props) => {
  const wallets = useFinanceStore(state => state.wallets);
  const [showArchived, setShowArchived] = useState(false);
  
  const activeWallets = wallets.filter(w => !w.isArchived);
  const archivedWallets = wallets.filter(w => w.isArchived);
  
  const displayWallets = showArchived ? [...activeWallets, ...archivedWallets] : activeWallets;

  return (
    <View style={styles.container}>
      <CustomHeader title="Wallets" />
      <FlatList
        data={displayWallets}
        keyExtractor={w => w.id}
        renderItem={({ item }) => (
          <View style={[item.isArchived && { opacity: 0.6 }]}>
            <WalletCard 
              wallet={item} 
              onPress={(w) => navigation.navigate('AddEditWallet', { walletId: w.id })} 
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No wallets found.</Text>}
        ListFooterComponent={
          archivedWallets.length > 0 ? (
            <TouchableOpacity style={styles.toggleArchived} onPress={() => setShowArchived(!showArchived)}>
              <Text style={styles.toggleArchivedText}>
                {showArchived ? 'Hide Archived Wallets' : `Show Archived Wallets (${archivedWallets.length})`}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.lg },
  empty: { ...theme.typography.body1, textAlign: 'center', color: theme.colors.textMuted, marginTop: theme.spacing.xxl },
  toggleArchived: { marginTop: theme.spacing.xl, padding: theme.spacing.md, alignItems: 'center' },
  toggleArchivedText: { ...theme.typography.body2, color: theme.colors.primary, fontWeight: 'bold' },
});
