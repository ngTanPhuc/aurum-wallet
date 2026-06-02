import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Wallet } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { MoneyAmount } from './MoneyAmount';
import { theme } from '../theme/theme';

interface WalletPickerProps {
  label: string;
  value?: string; // walletId
  onChange: (walletId: string) => void;
  error?: string;
  excludeWalletId?: string; // For transfers, to not select the same wallet
}

export const WalletPicker: React.FC<WalletPickerProps> = ({ label, value, onChange, error, excludeWalletId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const wallets = useFinanceStore(state => state.wallets);

  const availableWallets = wallets.filter(w => !w.isArchived && w.id !== excludeWalletId);
  const selectedWallet = wallets.find(w => w.id === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.selector, error ? styles.selectorError : null]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedWallet ? styles.selectedText : styles.placeholderText}>
          {selectedWallet ? selectedWallet.name : 'Select a wallet'}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Wallet</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableWallets}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.item}
                  onPress={() => {
                    onChange(item.id);
                    setModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <MoneyAmount amount={item.balance} currency={item.currency} style={styles.itemBalance} />
                  </View>
                  {value === item.id && <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.check} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: { ...theme.typography.body2, color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm, },
  selector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  selectorError: {
    borderColor: theme.colors.danger,
  },
  selectedText: { ...theme.typography.body1, color: theme.colors.textPrimary, },
  placeholderText: { ...theme.typography.body1, color: theme.colors.textMuted, },
  errorText: { ...theme.typography.caption, color: theme.colors.danger,
    marginTop: theme.spacing.xs, },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, },
  closeText: { ...theme.typography.body1, color: theme.colors.primary, },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceStrong,
  },
  itemName: { ...theme.typography.body1, color: theme.colors.textPrimary,
    fontWeight: '500', },
  itemBalance: { ...theme.typography.body2, color: theme.colors.textMuted,
    marginTop: theme.spacing.xs, },
  check: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
