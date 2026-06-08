import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, YieldPocketSettings } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { WalletPicker } from '../components/WalletPicker';

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

  useEffect(() => {
    if (isEditing && walletId) {
      const existing = yieldPocketSettings.find(s => s.walletId === walletId);
      if (existing) {
        setAnnualYieldRate(existing.annualYieldRate.toString());
        setYieldFrequency(existing.yieldFrequency);
        setAllowSpendingDirectly(existing.allowSpendingDirectly);
      }
    }
  }, [walletId, isEditing, yieldPocketSettings]);

  // We don't filter out wallets from the picker itself because WalletPicker fetches internally,
  // but we can validate it on save.
  const isWalletAvailable = (id: string) => {
    if (isEditing && id === walletId) return true;
    return !yieldPocketSettings.some(s => s.walletId === id);
  };

  const handleSave = async () => {
    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet.');
      return;
    }

    if (!isWalletAvailable(selectedWalletId)) {
      Alert.alert('Error', 'This wallet already has a Yield Pocket configured.');
      return;
    }

    const rateNum = parseFloat(annualYieldRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      Alert.alert('Error', 'Please enter a valid positive yield rate.');
      return;
    }

    const now = new Date().toISOString();
    let existing = yieldPocketSettings.find(s => s.walletId === selectedWalletId);

    const settings: YieldPocketSettings = {
      walletId: selectedWalletId,
      annualYieldRate: rateNum,
      yieldFrequency,
      postingMode: 'auto', // Default to auto for simplicity
      allowSpendingDirectly,
      lastYieldCalculatedAt: existing?.lastYieldCalculatedAt,
      nextYieldDate: existing?.nextYieldDate,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveYieldPocketSettings(settings);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save yield pocket settings.');
    }
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
        <TextInput 
          style={styles.input} 
          value={annualYieldRate} 
          onChangeText={setAnnualYieldRate} 
          keyboardType="decimal-pad"
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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Yield Pocket'}</Text>
        </TouchableOpacity>
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

  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: 32 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
