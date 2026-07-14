import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, YieldPocketSettings, Wallet } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { MoneyAmount } from '../components/MoneyAmount';
import { YieldPocketService } from '../services/YieldPocketService';

type Props = NativeStackScreenProps<RootStackParamList, 'YieldPockets'>;

const YieldPocketCard = ({ item, wallet, defaultCurrency, onPress, onCollect }: { item: YieldPocketSettings, wallet: Wallet, defaultCurrency: string, onPress: () => void, onCollect: () => void }) => {
  const [expectedYield, setExpectedYield] = useState<number>(0);

  useEffect(() => {
    YieldPocketService.calculateExpectedYieldAmount(item).then(setExpectedYield);
  }, [item, wallet.balance]);

  const isDue = YieldPocketService.isYieldDue(item);
  const isManual = item.postingMode === 'manual';

  return (
    <TouchableOpacity onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.walletInfoRow}>
            <Ionicons name="wallet" size={24} color={wallet.color || theme.colors.primary} style={styles.walletIcon} />
            <Text style={styles.walletName}>{wallet.name}</Text>
          </View>
          <Text style={styles.rateText}>{item.currentApy.toFixed(2)}% APY</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Balance</Text>
            <MoneyAmount amount={wallet.balance} currency={wallet.currency || defaultCurrency} style={styles.detailValue} />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Expected {item.yieldFrequency === 'daily' ? 'Daily' : 'Monthly'}</Text>
            <MoneyAmount amount={expectedYield} currency={wallet.currency || defaultCurrency} style={styles.detailValue} />
          </View>
        </View>

        {isManual && isDue ? (
          <TouchableOpacity style={styles.collectBtn} onPress={onCollect}>
            <Text style={styles.collectBtnText}>Collect Yield</Text>
            <MoneyAmount amount={expectedYield} currency={wallet.currency || defaultCurrency} style={styles.collectBtnText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.footerText}>
              Next yield: {item.nextYieldDate ? new Date(item.nextYieldDate).toLocaleDateString() : 'Pending'}
              {item.postingMode === 'manual' ? ' (Manual)' : ' (Auto)'}
            </Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

export const YieldPocketsScreen = ({ navigation }: Props) => {
  const yieldPocketSettings = useFinanceStore(state => state.yieldPocketSettings);
  const wallets = useFinanceStore(state => state.wallets);
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);
  const loadData = useFinanceStore(state => state.loadData);

  const handleCollect = async (item: YieldPocketSettings) => {
    try {
      const expectedYield = await YieldPocketService.calculateExpectedYieldAmount(item);
      if (expectedYield > 0) {
        await YieldPocketService.postYield(item, expectedYield, async (amount, dateStr) => {
          const { TransactionService } = require('../services/TransactionService');
          const uuid = require('react-native-uuid');
          await TransactionService.addTransaction({
            id: uuid.v4() as string,
            type: 'income',
            amount: amount,
            destinationWalletId: item.walletId,
            categoryId: 'interest_yield', // Assuming this exists or is handled
            note: 'Manual Yield Collection',
            transactionDate: dateStr,
            createdAt: dateStr,
            updatedAt: dateStr
          });
        });
        appAlert('Success', 'Yield collected successfully!');
        await loadData();
      } else {
        appAlert('Info', 'No yield to collect yet.');
      }
    } catch (e) {
      console.error(e);
      appAlert('Error', 'Failed to collect yield.');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Yield Pockets" 
        showBack={true} 
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('AddEditYieldPocket', { walletId: undefined })} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="add" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={yieldPocketSettings}
        keyExtractor={item => item.walletId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Earn flexible daily or monthly yield on your active wallets.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trending-up" size={64} color={theme.colors.border} />
            <Text style={styles.emptyText}>No Yield Pockets configured.</Text>
            <Text style={styles.emptySubText}>Tap the + button to convert a wallet into a yield pocket.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const wallet = wallets.find(w => w.id === item.walletId);
          if (!wallet) return null;

          return (
            <YieldPocketCard 
              item={item} 
              wallet={wallet} 
              defaultCurrency={defaultCurrency} 
              onPress={() => navigation.navigate('YieldPocketDetail', { walletId: item.walletId })} 
              onCollect={() => handleCollect(item)} 
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.lg, paddingBottom: 100 },
  headerText: { ...theme.typography.body1, color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { ...theme.typography.h3, color: theme.colors.textPrimary, marginTop: 16 },
  emptySubText: { ...theme.typography.body2, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8 },

  card: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  walletInfoRow: { flexDirection: 'row', alignItems: 'center' },
  walletIcon: { marginRight: 8 },
  walletName: { ...theme.typography.h3, color: theme.colors.textPrimary },
  rateText: { ...theme.typography.h2, color: theme.colors.success },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { flex: 1 },
  detailLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 4 },
  detailValue: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: 'bold' },

  footerRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  footerText: { ...theme.typography.body2, color: theme.colors.textMuted, marginLeft: 6 },
  
  collectBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.sm, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  collectBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
