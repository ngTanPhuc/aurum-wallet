import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { FinancialIntegrityService, IntegrityReport } from '../services/FinancialIntegrityService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../types';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const CURRENCIES = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export const SettingsScreen = ({ navigation }: Props) => {
  const { settings, updateCurrency, wipeData } = useSettingsStore();
  const loadData = useFinanceStore(state => state.loadData);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

  const handleIntegrityCheck = async () => {
    setIsCheckingIntegrity(true);
    try {
      const report = await FinancialIntegrityService.detectInconsistencies();
      
      if (report.isHealthy) {
        Alert.alert('System Healthy', 'All wallet balances perfectly match your transaction history.');
      } else {
        const details = report.details.join('\n\n');
        Alert.alert(
          'Inconsistencies Detected',
          `Found ${report.issuesCount} issue(s) with your wallet balances.\n\n${details}\n\nWould you like to repair them automatically based on the transaction history?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Repair Now', 
              onPress: async () => {
                await FinancialIntegrityService.repairBalances(report.discrepancies);
                await loadData();
                Alert.alert('Repaired', 'Wallet balances have been successfully restored.');
              }
            }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to check data integrity.');
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleWipeData = () => {
    Alert.alert(
      'Wipe All Data',
      'Are you absolutely sure you want to delete all wallets, transactions, budgets, and savings goals? This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Wipe Data', 
          style: 'destructive',
          onPress: async () => {
            await wipeData();
            Alert.alert('Success', 'All app data has been wiped clean.');
          }
        }
      ]
    );
  };

  const renderCurrencyModal = () => (
    <Modal visible={showCurrencyModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Currency</Text>
          <Text style={styles.modalSubtitle}>This will be the default for new wallets.</Text>
          
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.currencyOption}
                onPress={async () => {
                  await updateCurrency(item);
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={[styles.currencyText, settings.defaultCurrency === item && styles.currencyTextActive]}>
                  {item}
                </Text>
                {settings.defaultCurrency === item && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowCurrencyModal(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Templates')}>
          <Text style={styles.rowLabel}>Transaction Templates</Text>
          <View style={styles.rowValueContainer}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Tags')}>
          <Text style={styles.rowLabel}>Manage Tags</Text>
          <View style={styles.rowValueContainer}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setShowCurrencyModal(true)}>
          <Text style={styles.rowLabel}>Default Currency</Text>
          <View style={styles.rowValueContainer}>
            <Text style={styles.rowValue}>{settings.defaultCurrency}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <TouchableOpacity style={styles.row} onPress={handleIntegrityCheck} disabled={isCheckingIntegrity}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.rowLabel}>Data Integrity Check</Text>
            {isCheckingIntegrity && <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 8 }} />}
          </View>
          <View style={styles.rowValueContainer}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.row} onPress={handleWipeData}>
          <Text style={[styles.rowLabel, { color: theme.colors.danger }]}>Wipe All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App Version</Text>
          <Text style={styles.rowValue}>1.0.1</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Developer</Text>
          <Text style={styles.rowValue}>ngTanPhuc</Text>
        </View>
      </View>
      </ScrollView>

      {renderCurrencyModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: { ...theme.typography.caption, fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm, },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: { ...theme.typography.body1, color: theme.colors.textPrimary, },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: { ...theme.typography.body1, color: theme.colors.textMuted,
    marginRight: theme.spacing.sm, },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: { ...theme.typography.h2, color: theme.colors.textPrimary,
    marginBottom: 4, },
  modalSubtitle: { ...theme.typography.body2, color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg, },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  currencyText: { ...theme.typography.body1, color: theme.colors.textPrimary, },
  currencyTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
  },
  closeButtonText: { ...theme.typography.body1, fontWeight: '600',
    color: theme.colors.textPrimary, },
});
