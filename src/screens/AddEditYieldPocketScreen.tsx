import React, { useState, useEffect } from 'react';
import { AmountInput } from '../components/glass/AmountInput';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, YieldPocketSettings } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { WalletPicker } from '../components/WalletPicker';
import { YieldPocketService } from '../services/YieldPocketService';
import { getSettlementDate } from '../utils/settlementDate';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditYieldPocket'>;

export const AddEditYieldPocketScreen = ({ route, navigation }: Props) => {
  const { walletId } = route.params;
  const isEditing = !!walletId;
  
  const wallets = useFinanceStore(state => state.wallets);
  const yieldPocketSettings = useFinanceStore(state => state.yieldPocketSettings);
  const saveYieldPocketSettings = useFinanceStore(state => state.saveYieldPocketSettings);

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(walletId || null);
  const [annualYieldRate, setAnnualYieldRate] = useState('5.0');
  const [yieldFrequency, setYieldFrequency] = useState<'daily' | 'monthly'>('daily');
  const [allowSpendingDirectly, setAllowSpendingDirectly] = useState(true);
  const [postingMode, setPostingMode] = useState<'auto' | 'manual'>('auto');
  const [minimumBalanceStr, setMinimumBalanceStr] = useState('0');

  useEffect(() => {
    if (isEditing && walletId) {
      const existing = yieldPocketSettings.find(s => s.walletId === walletId);
      if (existing) {
        setAnnualYieldRate(existing.currentApy.toString());
        setYieldFrequency(existing.yieldFrequency);
        setAllowSpendingDirectly(existing.allowSpendingDirectly);
        setPostingMode(existing.postingMode || 'auto');
        setMinimumBalanceStr((existing.minimumBalance ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
      }
    }
  }, [walletId, isEditing, yieldPocketSettings]);

  const handleApyChange = (text: string) => {
    let val = text.replace(/[^0-9.]/g, '');
    if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
      val = val.replace(/^0+/, '');
    }
    setAnnualYieldRate(val);
  };

  const handleMinBalanceChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setMinimumBalanceStr('');
      return;
    }
    setMinimumBalanceStr(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  // We don't filter out wallets from the picker itself because WalletPicker fetches internally,
  // but we can validate it on save.
  const isWalletAvailable = (id: string) => {
    if (isEditing && id === walletId) return true;
    return !yieldPocketSettings.some(s => s.walletId === id);
  };

  const handleSave = async () => {
    if (!selectedWalletId) {
      appAlert('Error', 'Please select a wallet.');
      return;
    }

    if (!isWalletAvailable(selectedWalletId)) {
      appAlert('Error', 'This wallet already has a Yield Pocket configured.');
      return;
    }

    const rateNum = parseFloat(annualYieldRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      appAlert('Error', 'Please enter a valid positive yield rate.');
      return;
    }

    const now = new Date().toISOString();
    let existing = yieldPocketSettings.find(s => s.walletId === selectedWalletId);

    const wallet = wallets.find(w => w.id === selectedWalletId);
    const initialBalance = wallet ? wallet.balance : 0;
    const minBalance = Math.max(0, parseFloat(minimumBalanceStr.replace(/\./g, '')) || 0);

    // Determine initial qualification and settlement date for NEW pockets.
    // Existing pockets keep their current state.
    const isNewPocket = !existing;
    const newPocketIsQualified = isNewPocket
      ? (minBalance <= 0 || initialBalance >= minBalance)
      : existing!.isQualified;
    const newPocketSettlementDate = isNewPocket && newPocketIsQualified
      ? getSettlementDate(new Date()).toISOString()
      : (existing?.pendingSettlementDate ?? null);

    // nextYieldDate governs when the ROLLOVER fires (daily/monthly tick).
    // This is independent of pendingSettlementDate (which governs when balance earns).
    const firstYieldDate = existing?.nextYieldDate
      || YieldPocketService.getNextYieldDate(now, yieldFrequency);

    const settings: YieldPocketSettings = {
      walletId: selectedWalletId,
      yieldRule: existing?.yieldRule || 'T1_FUND',
      currentApy: rateNum,
      yieldFrequency,
      postingMode,
      allowSpendingDirectly,
      lastYieldCalculatedAt: existing?.lastYieldCalculatedAt,
      nextYieldDate: firstYieldDate,
      interestBearingBalance: existing ? existing.interestBearingBalance : 0,
      pendingDeposit: existing ? existing.pendingDeposit : initialBalance,
      lastRolloverDate: existing?.lastRolloverDate,
      lastSyncDate: existing?.lastSyncDate,
      minimumBalance: minBalance,
      pendingSettlementDate: newPocketSettlementDate,
      fractionalYieldCarry: existing?.fractionalYieldCarry ?? 0,
      isQualified: newPocketIsQualified,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await useFinanceStore.getState().saveYieldPocketSettings(settings);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      appAlert('Error', 'Failed to save yield pocket settings.');
    }
  };

  const handleDelete = () => {
    appAlert('Delete Yield Pocket', 'Are you sure you want to remove this yield pocket? Your wallet will not be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (selectedWalletId) {
          await useFinanceStore.getState().deleteYieldPocketSettings(selectedWalletId);
          navigation.goBack();
        }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader title={isEditing ? 'Edit Yield Pocket' : 'New Yield Pocket'} showBack={true} />
      </View>
      <KeyboardAwareScrollView 
        enableOnAndroid={true} 
        keyboardShouldPersistTaps="handled" 
        style={styles.container} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      >
        <View pointerEvents={isEditing ? 'none' : 'auto'} style={{ opacity: isEditing ? 0.6 : 1 }}>
          <WalletPicker 
            label="Select Wallet"
            value={selectedWalletId || undefined} 
            onChange={setSelectedWalletId} 
          />
        </View>

        <Text style={[styles.label, { marginTop: 8 }]}>Annual Yield Rate (APY %)</Text>
        <AmountInput
          style={styles.input}
          value={annualYieldRate}
          onChangeText={handleApyChange}
          allowDecimal
          placeholder="e.g. 5.5" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Yield Frequency</Text>
        <View style={styles.typeRow}>
          {['daily', 'monthly'].map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.typeBtn, yieldFrequency === f && styles.typeBtnActive]}
              onPress={() => setYieldFrequency(f as 'daily' | 'monthly')}
            >
              <Text style={[styles.typeText, yieldFrequency === f && styles.typeTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Posting Mode</Text>
        <View style={styles.typeRow}>
          {['auto', 'manual'].map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.typeBtn, postingMode === f && styles.typeBtnActive]}
              onPress={() => setPostingMode(f as 'auto' | 'manual')}
            >
              <Text style={[styles.typeText, postingMode === f && styles.typeTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Allow Spending Directly</Text>
            <Text style={styles.switchSubLabel}>If off, money is "locked" and cannot be spent in transactions.</Text>
          </View>
          <Switch
            value={allowSpendingDirectly}
            onValueChange={setAllowSpendingDirectly}
            trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
          />
        </View>

        <Text style={styles.label}>Minimum Balance Threshold</Text>
        <AmountInput
          style={styles.input}
          value={minimumBalanceStr}
          onChangeText={handleMinBalanceChange}
          allowDecimal={false}
          placeholder="e.g. 10000"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={styles.fieldHint}>Interest only accrues when the balance meets or exceeds this amount. Set to 0 to always earn interest.</Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Yield Pocket'}</Text>
        </TouchableOpacity>
        
        {isEditing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Yield Pocket</Text>
          </TouchableOpacity>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
  warningText: { ...theme.typography.body2, color: theme.colors.warning, marginTop: 8 },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary },
  
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, alignItems: 'center', textTransform: 'capitalize' },
  typeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeText: { color: theme.colors.textMuted, textTransform: 'capitalize' },
  typeTextActive: { color: theme.colors.background },
  
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, padding: 16, backgroundColor: theme.colors.surface, borderRadius: theme.radii.md },
  switchLabel: { ...theme.typography.body1, color: theme.colors.textPrimary, marginBottom: 4 },
  switchSubLabel: { ...theme.typography.body2, color: theme.colors.textMuted, fontSize: 12 },

  fieldHint: { ...theme.typography.body2, color: theme.colors.textMuted, fontSize: 12, marginTop: 6, marginBottom: 4 },

  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: 32 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
  deleteBtn: { padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: 16 },
  deleteBtnText: { ...theme.typography.body1, color: theme.colors.danger, fontWeight: 'bold' },
});
