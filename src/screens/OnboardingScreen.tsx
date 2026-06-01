import React, { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFinanceStore } from '../store/useFinanceStore';
import uuid from 'react-native-uuid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen = ({ navigation }: Props) => {
  const { updateCurrency, completeFirstRun } = useSettingsStore();
  const addWallet = useFinanceStore(state => state.addWallet);
  const insets = useSafeAreaInsets();
  
  const [currency, setCurrency] = useState('VND');
  const [walletName, setWalletName] = useState('Cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#4caf50');

  const WALLET_COLORS = [
    '#4caf50', '#2196f3', '#9c27b0', '#ff9800', 
    '#e91e63', '#00bcd4', '#795548', '#607d8b'
  ];

  const handleAmountChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    const trimmed = digitsOnly.replace(/^0+/, '');
    if (!trimmed) {
      setInitialBalance('');
      return;
    }
    const formatted = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setInitialBalance(formatted);
  };

  const handleComplete = async () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    try {
      const rawValue = initialBalance.replace(/\./g, '');
      const balanceNum = parseFloat(rawValue) || 0;
      
      // Set currency
      await updateCurrency(currency);
      
      // Create first wallet
      await addWallet({
        id: uuid.v4() as string,
        name: walletName,
        type: 'cash',
        balance: balanceNum,
        initialBalance: balanceNum,
        currency: currency,
        includeInTotal: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: color,
        icon: '💵',
      });

      // Mark complete
      await completeFirstRun();
    } catch (e: any) {
      console.error('Error in Onboarding handleComplete:', e);
      Alert.alert('Error', e?.message || 'Something went wrong while saving.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAwareScrollView 
        style={[styles.container, { paddingTop: insets.top + 24 }]} 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        enableOnAndroid={true} 
        keyboardShouldPersistTaps="handled" 
        extraScrollHeight={20}
      >
        <Text style={styles.title}>Welcome to Aurum!</Text>
        <Text style={styles.subtitle}>Let's set up your first wallet.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Default Currency</Text>
          <View style={styles.currencyRow}>
            {['VND', 'USD', 'EUR'].map(c => (
              <TouchableOpacity 
                key={c}
                style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Wallet Name</Text>
          <TextInput 
            style={styles.input}
            value={walletName}
            onChangeText={setWalletName}
            placeholder="e.g. Cash, Main Bank"
            placeholderTextColor={theme.colors.textMuted}
          />

          <Text style={styles.label}>Color</Text>
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

          <Text style={styles.label}>Initial Balance</Text>
          <TextInput 
            style={styles.input}
            value={initialBalance}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.btn} onPress={handleComplete}>
            <Text style={styles.btnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.xl, backgroundColor: theme.colors.background },
  title: { ...theme.typography.h1, marginBottom: theme.spacing.sm, color: theme.colors.text },
  subtitle: { ...theme.typography.body1, color: theme.colors.textMuted, marginBottom: 32 },
  form: { gap: 16 },
  label: { ...theme.typography.body2, color: theme.colors.text, marginBottom: -8 },
  input: { ...theme.typography.body1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.text },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBtn: { flex: 1, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, alignItems: 'center' },
  currencyBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  currencyText: { color: theme.colors.textMuted, fontWeight: '500' },
  currencyTextActive: { color: theme.colors.background },
  colorScroll: { marginHorizontal: -4 },
  colorRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorCircleActive: { borderColor: theme.colors.text, transform: [{ scale: 1.1 }] },
  btn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  btnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
