import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { DebtService } from '../services/DebtService';

type Props = NativeStackScreenProps<RootStackParamList, 'DebtDetail'>;

export const DebtDetailScreen = ({ navigation, route }: Props) => {
  const { debtId } = route.params;
  const { debts, people, wallets, debtPayments, updateDebtStatus } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const debt = debts.find(d => d.id === debtId);
  const person = people.find(p => p.id === debt?.personId);
  const wallet = wallets.find(w => w.id === debt?.walletId);
  const payments = debtPayments.filter(dp => dp.debtId === debtId);

  if (!debt) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Debt Not Found" showBackButton />
      </View>
    );
  }

  const formatCurrency = (val: number) => `${val.toLocaleString()} ${defaultCurrency}`;

  const handleMarkPaid = () => {
    Alert.alert('Mark as Paid', 'Are you sure you want to mark this debt as paid? No transaction will be created for the remaining amount.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', style: 'default', onPress: () => {
        updateDebtStatus(debt.id, 'paid');
        navigation.goBack();
      }}
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Debt', 'Are you sure you want to cancel this debt?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Debt', style: 'destructive', onPress: () => {
        updateDebtStatus(debt.id, 'cancelled');
        navigation.goBack();
      }}
    ]);
  };

  const overdue = DebtService.isDebtOverdue(debt);
  const isLent = debt.direction === 'lent';

  return (
    <View style={styles.container}>
      <CustomHeader title={isLent ? 'Lent Money Details' : 'Borrowed Money Details'} showBackButton />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.heroCard}>
          <Text style={styles.heroLabel}>{isLent ? 'Owed to you by' : 'You owe to'}</Text>
          <Text style={styles.heroPerson}>{person?.name || 'Unknown'}</Text>
          <Text style={[styles.heroAmount, { color: isLent ? theme.colors.success : theme.colors.warning }]}>
            {formatCurrency(debt.remainingAmount)}
          </Text>
          <Text style={styles.heroSub}>remaining of {formatCurrency(debt.totalExpectedAmount)}</Text>
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {debt.status.replace('_', ' ').toUpperCase()} {overdue ? '(OVERDUE)' : ''}
            </Text>
          </View>
        </GlassCard>

        {debt.status !== 'paid' && debt.status !== 'cancelled' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('RecordDebtPayment', { debtId: debt.id })}
            >
              <Text style={styles.actionBtnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionRowAlt}>
          {debt.status !== 'paid' && debt.status !== 'cancelled' && (
            <TouchableOpacity style={styles.altBtn} onPress={handleMarkPaid}>
              <Text style={styles.altBtnText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          {debt.status !== 'cancelled' && (
            <TouchableOpacity style={styles.altBtn} onPress={handleCancel}>
              <Text style={[styles.altBtnText, { color: theme.colors.danger }]}>Cancel Debt</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Principal</Text>
            <Text style={styles.detailValue}>{formatCurrency(debt.principalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest ({debt.interestType})</Text>
            <Text style={styles.detailValue}>{formatCurrency(debt.interestAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid so far</Text>
            <Text style={[styles.detailValue, { color: theme.colors.success }]}>{formatCurrency(debt.amountPaid)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Linked Wallet</Text>
            <Text style={styles.detailValue}>{wallet?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>{new Date(debt.startDate).toLocaleDateString()}</Text>
          </View>
          {debt.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={[styles.detailValue, overdue && { color: theme.colors.danger }]}>{new Date(debt.dueDate).toLocaleDateString()}</Text>
            </View>
          )}
          {debt.note && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValue}>{debt.note}</Text>
            </View>
          )}
        </GlassCard>

        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {payments.map(p => (
              <GlassCard key={p.id} style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.paymentDate}>{new Date(p.paymentDate).toLocaleDateString()}</Text>
                    {p.note && <Text style={styles.paymentNote}>{p.note}</Text>}
                  </View>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
              </GlassCard>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  
  heroCard: { padding: 24, alignItems: 'center', marginBottom: 20 },
  heroLabel: { ...theme.typography.body2, color: theme.colors.textMuted },
  heroPerson: { ...theme.typography.h2, color: theme.colors.textPrimary, marginVertical: 4 },
  heroAmount: { ...theme.typography.h1, marginVertical: 8 },
  heroSub: { ...theme.typography.body2, color: theme.colors.textMuted },
  statusBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border },
  statusText: { ...theme.typography.body2, color: theme.colors.textPrimary, fontWeight: 'bold', fontSize: 12 },
  
  actionRow: { marginBottom: 12 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { ...theme.typography.body1, color: '#fff', fontWeight: 'bold' },
  
  actionRowAlt: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  altBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: theme.colors.surfaceLight, marginHorizontal: 4, borderWidth: 1, borderColor: theme.colors.border },
  altBtnText: { ...theme.typography.body2, color: theme.colors.textPrimary, fontWeight: 'bold' },
  
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 12, marginLeft: 4 },
  detailsCard: { padding: 16, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  detailLabel: { ...theme.typography.body1, color: theme.colors.textMuted },
  detailValue: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  
  paymentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 12 },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentDate: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: '500' },
  paymentNote: { ...theme.typography.body2, color: theme.colors.textMuted, fontSize: 12 },
  paymentAmount: { ...theme.typography.body1, color: theme.colors.success, fontWeight: 'bold' }
});
