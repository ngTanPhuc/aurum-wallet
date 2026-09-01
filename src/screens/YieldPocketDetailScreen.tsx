import React, { useState, useEffect } from 'react';
import { AmountInput } from '../components/glass/AmountInput';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Animated
} from 'react-native';
import { useKeypad } from '../context/KeypadContext';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { MoneyAmount } from '../components/MoneyAmount';
import { YieldPocketService } from '../services/YieldPocketService';
import { TransactionService } from '../services/TransactionService';
import uuid from 'react-native-uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'YieldPocketDetail'>;

export const YieldPocketDetailScreen = ({ route, navigation }: Props) => {
  const { walletId } = route.params;

  const yieldPocketSettings = useFinanceStore(state => state.yieldPocketSettings);
  const wallets = useFinanceStore(state => state.wallets);
  const transactions = useFinanceStore(state => state.transactions);
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);
  const { appTranslateY } = useKeypad();
  const loadData = useFinanceStore(state => state.loadData);

  // All hooks must be called before any early return (Rules of Hooks)
  const categories = useFinanceStore(state => state.categories);

  const pocket = yieldPocketSettings.find(s => s.walletId === walletId);
  const wallet = wallets.find(w => w.id === walletId);

  const [expectedYield, setExpectedYield] = useState<number>(0);

  // Smart Sync state
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncInput, setSyncInput] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (pocket) {
      YieldPocketService.calculateExpectedYieldAmount(pocket).then(setExpectedYield);
    }
  }, [pocket, wallet?.balance]);

  const yieldCategory = categories.find(c => c.name === 'Yield Interest' && c.type === 'income');
  const history = transactions
    .filter(t =>
      t.type === 'income' &&
      t.sourceWalletId === walletId &&
      (
        (yieldCategory && t.categoryId === yieldCategory.id) ||
        t.note === 'Yield earned' ||
        t.note === 'Manual Yield Collection'
      )
    )
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  if (!pocket || !wallet) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Not Found" showBack={true} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Yield Pocket not found.</Text>
        </View>
      </View>
    );
  }

  const handleCollect = async () => {
    try {
      if (expectedYield > 0) {
        await YieldPocketService.postYield(pocket, expectedYield, async (amount, dateStr) => {
          await TransactionService.addTransaction({
            id: uuid.v4() as string,
            type: 'income',
            amount: amount,
            sourceWalletId: walletId,
            categoryId: yieldCategory?.id,
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

  const handleSmartSync = async () => {
    const rawDigits = syncInput.replace(/\./g, '').replace(/,/g, '');
    const actualBalance = parseFloat(rawDigits);

    if (isNaN(actualBalance) || actualBalance < 0) {
      appAlert('Invalid Amount', 'Please enter a valid balance.');
      return;
    }

    // Capture state BEFORE sync for accurate feedback
    const discrepancy = Math.round(actualBalance) - Math.round(wallet.balance);
    const isFirstSync = !pocket.lastSyncDate; // APY learning needs two sync points

    if (discrepancy === 0) {
      appAlert('Already in Sync', 'Your tracked balance already matches the entered amount. No changes made.');
      return;
    }

    setSyncing(true);
    const oldApy = pocket.currentApy;

    // Estimate max plausible interest since last sync (or creation)
    const baselineDate = pocket.lastSyncDate || pocket.createdAt;
    const daysSinceSync = baselineDate
      ? (Date.now() - new Date(baselineDate).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const maxPlausibleInterest = daysSinceSync > 0
      ? Math.ceil((wallet.balance * 0.15 / 365) * daysSinceSync)
      : Infinity;
    const discrepancyLooksLikeDeposit = Math.abs(discrepancy) > maxPlausibleInterest * 3;

    try {
      await YieldPocketService.syncActualBalance(
        walletId,
        actualBalance,
        new Date(),
        async (diff) => {
          const now = new Date().toISOString();
          await TransactionService.addTransaction({
            id: uuid.v4() as string,
            type: 'adjustment',
            amount: diff,
            sourceWalletId: walletId,
            note: 'Smart Sync adjustment',
            transactionDate: now,
            createdAt: now,
            updatedAt: now,
          });
        }
      );

      await loadData();

      // Re-read settings to get the new APY
      const updated = await YieldPocketService.getSettingsForWallet(walletId);
      const newApy = updated?.currentApy ?? oldApy;
      const apyChanged = Math.abs(newApy - oldApy) > 0.001;
      const sign = discrepancy > 0 ? '+' : '';

      setSyncModalVisible(false);
      setSyncInput('');

      if (apyChanged) {
        appAlert(
          '✅ Sync Complete',
          `Balance corrected (${sign}${discrepancy.toLocaleString()}₫).\n\nAPY updated: ${oldApy.toFixed(2)}% → ${newApy.toFixed(2)}%\n\nFuture yield will use the new rate.`
        );
      } else if (discrepancyLooksLikeDeposit) {
        appAlert(
          '✅ Balance Corrected',
          `Balance adjusted by ${sign}${discrepancy.toLocaleString()}₫.\n\nAPY was NOT updated — this discrepancy is too large to be explained by interest alone. It looks like an unrecorded deposit or withdrawal.\n\nIf you intentionally moved money in your fund app without recording it here, this is expected.`
        );
      } else {
        appAlert(
          '✅ Sync Complete',
          `Balance corrected (${sign}${discrepancy.toLocaleString()}₫).\n\nThe inferred APY was outside the valid range of 0.5%–15%, so your rate remains at ${oldApy.toFixed(2)}%.`
        );
      }
    } catch (e) {
      console.error(e);
      appAlert('Error', 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const isDue = YieldPocketService.isYieldDue(pocket);
  const isManual = pocket.postingMode === 'manual';
  const lastSyncLabel = pocket.lastSyncDate
    ? new Date(pocket.lastSyncDate).toLocaleDateString()
    : 'Never';

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Yield Pocket"
        showBack={true}
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('AddEditYieldPocket', { walletId })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.walletInfoRow}>
                  <Ionicons name="wallet" size={24} color={wallet.color || theme.colors.primary} style={styles.walletIcon} />
                  <Text style={styles.walletName}>{wallet.name}</Text>
                </View>
                <Text style={styles.rateText}>{pocket.currentApy.toFixed(2)}% APY</Text>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Balance</Text>
                  <MoneyAmount amount={wallet.balance} currency={wallet.currency || defaultCurrency} style={styles.detailValue} />
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Expected {pocket.yieldFrequency === 'daily' ? 'Daily' : 'Monthly'}</Text>
                  <MoneyAmount amount={expectedYield} currency={wallet.currency || defaultCurrency} style={styles.detailValue} />
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mode</Text>
                  <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>{pocket.postingMode}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Spending</Text>
                  <Text style={styles.detailValue}>{pocket.allowSpendingDirectly ? 'Allowed' : 'Locked'}</Text>
                </View>
              </View>

              {/* Settlement pending banner */}
              {pocket.pendingSettlementDate && new Date(pocket.pendingSettlementDate) > new Date() && (
                <View style={styles.settlingBanner}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.settlingText}>
                    Settling — yield starts on{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {new Date(pocket.pendingSettlementDate).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric'
                      })}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Not yet qualified (balance below threshold) */}
              {!pocket.isQualified && (
                <View style={styles.settlingBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.settlingText}>
                    Balance is below the minimum threshold — no yield is accruing.
                  </Text>
                </View>
              )}

              {isManual && isDue ? (
                <TouchableOpacity style={styles.collectBtn} onPress={handleCollect}>
                  <Text style={styles.collectBtnText}>Collect Yield</Text>
                  <MoneyAmount amount={expectedYield} currency={wallet.currency || defaultCurrency} style={styles.collectBtnText} />
                </TouchableOpacity>
              ) : (
                <View style={styles.footerRow}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
                  <Text style={styles.footerText}>
                    Next yield: {pocket.nextYieldDate ? new Date(pocket.nextYieldDate).toLocaleDateString() : 'Pending'}
                  </Text>
                </View>
              )}

              {/* Smart Sync Button */}
              <TouchableOpacity style={styles.syncBtn} onPress={() => setSyncModalVisible(true)}>
                <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
                <View style={styles.syncBtnTextGroup}>
                  <Text style={styles.syncBtnText}>Smart APY Sync</Text>
                  <Text style={styles.syncBtnSub}>Last synced: {lastSyncLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>

            <Text style={styles.sectionTitle}>Recent Yield History</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubText}>No yield collected yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="trending-up" size={20} color={theme.colors.success} />
              </View>
              <View>
                <Text style={styles.historyTitle}>{item.note === 'Manual Yield Collection' ? 'Manual Collection' : 'Yield Earned'}</Text>
                <Text style={styles.historyDate}>{new Date(item.transactionDate).toLocaleDateString()}</Text>
              </View>
            </View>
            <MoneyAmount amount={item.amount} currency={wallet.currency || defaultCurrency} style={styles.historyAmount} />
          </View>
        )}
      />

      {/* Smart Sync Modal */}
      <Modal visible={syncModalVisible} animationType="fade" transparent>
        <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: appTranslateY }] }]}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="sync-circle-outline" size={28} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>Smart APY Sync</Text>
            </View>

            <Text style={styles.modalDesc}>
              Open your real fund app (e.g. MoMo), check your exact balance, and enter it below. Aurum Wallet will correct any drift and auto-update the APY.
            </Text>

            <Text style={styles.modalLabel}>Current tracked balance</Text>
            <View style={styles.trackedRow}>
              <MoneyAmount amount={wallet.balance} currency={wallet.currency || defaultCurrency} style={styles.trackedValue} />
            </View>

            <Text style={styles.modalLabel}>Your actual balance in the fund</Text>
            <AmountInput
              style={styles.modalInput}
              value={syncInput}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '');
                const trimmed = digits.replace(/^0+/, '') || '';
                setSyncInput(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
              }}
              placeholder="e.g. 201.500"
              placeholderTextColor={theme.colors.textMuted}
              
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setSyncModalVisible(false); setSyncInput(''); }}
                disabled={syncing}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn, syncing && { opacity: 0.6 }]}
                onPress={handleSmartSync}
                disabled={syncing}
              >
                {syncing
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.confirmBtnText}>Sync Now</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.lg, paddingBottom: 100 },
  editBtnText: { ...theme.typography.body1, color: theme.colors.primary, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { ...theme.typography.h3, color: theme.colors.textPrimary },
  emptySubText: { ...theme.typography.body2, color: theme.colors.textMuted },

  card: { padding: theme.spacing.lg, marginBottom: theme.spacing.xl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  walletInfoRow: { flexDirection: 'row', alignItems: 'center' },
  walletIcon: { marginRight: 8 },
  walletName: { ...theme.typography.h3, color: theme.colors.textPrimary },
  rateText: { ...theme.typography.h2, color: theme.colors.success },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { flex: 1 },
  detailLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 4 },
  detailValue: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: 'bold' },

  footerRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginBottom: 12 },
  footerText: { ...theme.typography.body2, color: theme.colors.textMuted, marginLeft: 6 },

  collectBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.sm, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  collectBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },

  syncBtn: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, gap: 10 },
  syncBtnTextGroup: { flex: 1 },
  syncBtnText: { ...theme.typography.body1, color: theme.colors.primary, fontWeight: '600' },
  syncBtnSub: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: 1 },

  settlingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.warning + '18', borderRadius: theme.radii.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.sm },
  settlingText: { ...theme.typography.body2, color: theme.colors.warning, flex: 1 },

  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },

  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, marginBottom: theme.spacing.sm },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyTitle: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: '500' },
  historyDate: { ...theme.typography.body2, color: theme.colors.textMuted },
  historyAmount: { ...theme.typography.body1, color: theme.colors.success, fontWeight: 'bold' },

  // Smart Sync Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,12,23,0.88)', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  modalBox: { backgroundColor: theme.colors.backgroundAlt, borderRadius: theme.radii.xl, padding: theme.spacing.xl, width: '100%', borderWidth: 1, borderColor: theme.colors.glassBorder },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing.md },
  modalTitle: { ...theme.typography.h2, color: theme.colors.textPrimary },
  modalDesc: { ...theme.typography.body2, color: theme.colors.textMuted, lineHeight: 20, marginBottom: theme.spacing.lg },
  modalLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  trackedRow: { marginBottom: theme.spacing.lg },
  trackedValue: { ...theme.typography.h3, color: theme.colors.textPrimary, fontWeight: 'bold' },
  modalInput: { ...theme.typography.h3, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.xl, textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: theme.spacing.md },
  modalBtn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radii.md, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { borderWidth: 1, borderColor: theme.colors.border },
  cancelBtnText: { ...theme.typography.body1, color: theme.colors.textPrimary },
  confirmBtn: { backgroundColor: theme.colors.primary },
  confirmBtnText: { ...theme.typography.body1, color: '#000', fontWeight: 'bold' },
});
