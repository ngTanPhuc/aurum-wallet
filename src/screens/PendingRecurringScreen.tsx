import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RecurringTransaction } from '../types';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import { AmountInput } from '../components/glass/AmountInput';


type Props = NativeStackScreenProps<RootStackParamList, 'PendingRecurring'>;

export const PendingRecurringScreen = ({ navigation }: Props) => {
  const pendingRecurringTransactions = useFinanceStore(state => state.pendingRecurringTransactions);
  const wallets = useFinanceStore(state => state.wallets);
  const categories = useFinanceStore(state => state.categories);
  const confirmPendingTransaction = useFinanceStore(state => state.confirmPendingTransaction);
  const skipPendingTransaction = useFinanceStore(state => state.skipPendingTransaction);

  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const getWalletName = (id: string) => wallets.find(w => w.id === id)?.name || 'Unknown Wallet';
  const getCategory = (id?: string) => categories.find(c => c.id === id);

  const handleConfirm = async (item: RecurringTransaction, customAmount?: number, customNote?: string) => {
    // Check for insufficient funds for expense/transfer
    if (item.type === 'expense' || item.type === 'transfer') {
      const wallet = wallets.find(w => w.id === item.walletId);
      const amt = customAmount !== undefined ? customAmount : item.amount;
      if (wallet && wallet.balance < amt) {
        return Alert.alert(
          'Insufficient Funds',
          `Your ${wallet.name} balance (${wallet.balance.toLocaleString()}) is lower than the transaction amount (${amt.toLocaleString()}). Are you sure you want to proceed and go into negative balance?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Proceed', 
              style: 'destructive',
              onPress: async () => {
                await confirmPendingTransaction(item, { amount: customAmount, note: customNote });
              }
            }
          ]
        );
      }
    }
    
    await confirmPendingTransaction(item, { amount: customAmount, note: customNote });
  };

  const handleSkip = (item: RecurringTransaction) => {
    Alert.alert(
      'Skip Transaction',
      'This will push the due date to the next cycle without creating a transaction. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: async () => {
            await skipPendingTransaction(item);
          }
        }
      ]
    );
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    setEditNote(item.note || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const rawValue = editAmount.replace(/\./g, '');
    const amtNum = Math.abs(parseFloat(rawValue) || 0);
    if (amtNum <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }
    await handleConfirm(editingItem, amtNum, editNote);
    setEditingItem(null);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Pending Actions" showBack={true} />
      <FlatList
        data={pendingRecurringTransactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const category = getCategory(item.categoryId);
          const isTransfer = item.type === 'transfer';
          const sign = item.type === 'expense' ? '-' : (item.type === 'income' ? '+' : '');
          const amountColor = item.type === 'expense' ? '#f44336' : (item.type === 'income' ? '#4caf50' : '#2196f3');
          const formattedAmount = item.amount.toLocaleString();

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {(!category?.icon || /^[a-z0-9-]+$/.test(category.icon)) ? (
                    <Ionicons name={category?.icon as any || (isTransfer ? 'swap-horizontal' : 'wallet')} size={32} color={theme.colors.textPrimary} style={styles.icon} />
                  ) : (
                    <Text style={[styles.icon, { fontSize: 32 }]}>{category.icon}</Text>
                  )}
                  <View>
                    <Text style={styles.title}>{category?.name || (isTransfer ? 'Transfer' : 'Transaction')}</Text>
                    <Text style={styles.subtitle}>
                      {isTransfer 
                        ? `${getWalletName(item.walletId)} → ${getWalletName(item.destinationWalletId!)}`
                        : getWalletName(item.walletId)
                      }
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.amount, { color: amountColor }]}>{sign} {formattedAmount}</Text>
                  <Text style={styles.dueText}>Due: {new Date(item.nextDueDate).toLocaleDateString()}</Text>
                </View>
              </View>

              {!!item.note && <Text style={styles.note}>{item.note}</Text>}

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={() => handleSkip(item)}>
                  <Text style={styles.btnSkipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => openEditModal(item)}>
                  <Text style={styles.btnEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={() => handleConfirm(item)}>
                  <Text style={styles.btnConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyDesc}>You have no pending recurring transactions.</Text>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={!!editingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Occurrence</Text>
            <Text style={styles.modalDesc}>Change the amount or note for this specific transaction only. The recurring template will not be changed.</Text>
            
            <Text style={styles.label}>Amount</Text>
            <TextInput 
              style={styles.input} 
              value={editAmount} 
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, '');
                const trimmed = digitsOnly.replace(/^0+/, '');
                if (!trimmed) return setEditAmount('');
                setEditAmount(trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
              }}
              keyboardType="numeric" 
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput 
              style={styles.input} 
              value={editNote} 
              onChangeText={setEditNote} 
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingItem(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveText}>Confirm with Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContainer: { padding: theme.spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, ...theme.shadows.subtle },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, marginRight: theme.spacing.md },
  title: { ...theme.typography.body1, fontWeight: '600', color: theme.colors.textPrimary },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  amount: { ...theme.typography.h3, fontWeight: 'bold' },
  dueText: { ...theme.typography.caption, color: theme.colors.danger, fontWeight: 'bold', marginTop: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  note: { ...theme.typography.caption, marginBottom: theme.spacing.md, color: theme.colors.textMuted, fontStyle: 'italic', backgroundColor: theme.colors.background, padding: theme.spacing.sm, borderRadius: theme.radii.sm },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  btn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radii.sm, alignItems: 'center' },
  btnSkip: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  btnSkipText: { color: theme.colors.textMuted, fontWeight: '600' },
  btnEdit: { backgroundColor: theme.colors.surfaceStrong },
  btnEditText: { color: theme.colors.primary, fontWeight: '600' },
  btnConfirm: { backgroundColor: theme.colors.primary },
  btnConfirmText: { color: theme.colors.background, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, marginTop: 64 },
  emptyIcon: { fontSize: 64, marginBottom: theme.spacing.lg },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  emptyDesc: { ...theme.typography.body2, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: 20 },
  backBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radii.sm },
  backBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: theme.spacing.xl },
  modalContent: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.spacing.xl },
  modalTitle: { ...theme.typography.h3, marginBottom: theme.spacing.sm, color: theme.colors.textPrimary },
  modalDesc: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.xl, lineHeight: 18 },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.sm },
  modalCancelBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm },
  modalCancelText: { color: theme.colors.textMuted, fontWeight: '600' },
  modalSaveBtn: { flex: 2, padding: 14, alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radii.sm },
  modalSaveText: { color: theme.colors.background, fontWeight: 'bold' },
});
