import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Wallet } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { useSettingsStore } from '../store/useSettingsStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';


type Props = NativeStackScreenProps<RootStackParamList, 'AddEditWallet'>;

export const AddEditWalletScreen = ({ route, navigation }: Props) => {
  const { walletId } = route.params;
  const isEditing = !!walletId;
  
  const wallets = useFinanceStore(state => state.wallets);
  const addWallet = useFinanceStore(state => state.addWallet);
  const updateWallet = useFinanceStore(state => state.updateWallet);
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('cash');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [color, setColor] = useState('#4caf50');

  const WALLET_COLORS = [
    '#4caf50', '#2196f3', '#9c27b0', '#ff9800', 
    '#e91e63', '#00bcd4', '#795548', '#607d8b'
  ];

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setBalance('');
      return;
    }
    const formatted = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setBalance(formatted);
  };

  useEffect(() => {
    if (isEditing && walletId) {
      const w = wallets.find(w => w.id === walletId);
      if (w) {
        setName(w.name);
        setType(w.type);
        setBalance(w.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        setCurrency(w.currency);
        if (w.color) setColor(w.color);
      }
    }
  }, [walletId, isEditing, wallets]);

  const handleSave = async () => {
    if (!name.trim() || !balance.trim()) return;
    
    const rawValue = balance.replace(/\./g, '');
    const balanceNum = parseFloat(rawValue) || 0;

    if (isEditing && walletId) {
      const existing = wallets.find(w => w.id === walletId);
      if (existing) {
        await updateWallet({
          ...existing,
          name,
          type,
          balance: balanceNum, // If modifying balance directly, it replaces it. In real apps, we prefer adjustments.
          currency,
          color,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      await addWallet({
        id: uuid.v4() as string,
        name,
        type,
        balance: balanceNum,
        initialBalance: balanceNum,
        currency,
        color,
        includeInTotal: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.headerWrapper}>
        <CustomHeader title={isEditing ? 'Edit Wallet' : 'New Wallet'} showBack={true} />
      </View>
      <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}  style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}>
        <Text style={styles.label}>Wallet Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="e.g. My Bank Account"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {['cash', 'bank', 'ewallet'].map(t => (
            <TouchableOpacity 
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t as any)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Color</Text>
        <View style={{ height: 48, marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
            <View style={styles.colorRow}>
              {WALLET_COLORS.map(c => (
                <TouchableOpacity 
                  key={c}
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c },
                    color === c && styles.colorCircleActive
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <Text style={[styles.label, { marginTop: 8 }]}>Balance</Text>
        <AmountInput 
          style={styles.input} 
          value={balance} 
          onChangeText={handleAmountChange} 
           
          placeholder="0" 
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Currency</Text>
        <TextInput 
          style={styles.input} 
          value={currency} 
          onChangeText={setCurrency} 
          placeholder="VND, USD..." 
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Wallet'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, alignItems: 'center' },
  typeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeText: { color: theme.colors.textMuted, textTransform: 'capitalize' },
  typeTextActive: { color: theme.colors.background },
  colorScroll: { marginHorizontal: -4 },
  colorRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorCircleActive: { borderColor: theme.colors.textPrimary, transform: [{ scale: 1.1 }] },
  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: 32 },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
