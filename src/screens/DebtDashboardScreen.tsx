import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { DebtService } from '../services/DebtService';

type Props = NativeStackScreenProps<RootStackParamList, 'DebtDashboard'>;

export const DebtDashboardScreen = ({ navigation }: Props) => {
  const { debts, people } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const { owedToMe, iOwe, dueSoon, overdue, activeDebts, paidDebts } = useMemo(() => {
    let owedToMe = 0;
    let iOwe = 0;
    const dueSoon = [];
    const overdue = [];
    const activeDebts = [];
    const paidDebts = [];

    debts.forEach(d => {
      if (d.status === 'paid' || d.status === 'cancelled') {
        paidDebts.push(d);
        return;
      }

      activeDebts.push(d);

      if (d.direction === 'lent') owedToMe += d.remainingAmount;
      if (d.direction === 'borrowed') iOwe += d.remainingAmount;

      if (DebtService.isDebtOverdue(d)) {
        overdue.push(d);
      } else if (d.dueDate) {
        const diff = new Date(d.dueDate).getTime() - new Date().getTime();
        if (diff > 0 && diff < 7 * 24 * 60 * 60 * 1000) {
          dueSoon.push(d);
        }
      }
    });

    return { owedToMe, iOwe, dueSoon, overdue, activeDebts, paidDebts };
  }, [debts]);

  const formatCurrency = (val: number) => `${val.toLocaleString()} ${defaultCurrency}`;

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || 'Unknown';

  return (
    <View style={styles.container}>
      <CustomHeader title="Debt & Lending" showBackButton />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('AddEditDebt', { direction: 'lent' })}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="arrow-up" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.actionText}>I lent money</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('AddEditDebt', { direction: 'borrowed' })}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="arrow-down" size={24} color={theme.colors.warning} />
            </View>
            <Text style={styles.actionText}>I borrowed</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total owed to me</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{formatCurrency(owedToMe)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total I owe</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{formatCurrency(iOwe)}</Text>
          </GlassCard>
        </View>

        {overdue.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>Overdue</Text>
            {overdue.map(d => (
              <TouchableOpacity key={d.id} onPress={() => navigation.navigate('DebtDetail', { debtId: d.id })}>
                <GlassCard style={styles.debtCard}>
                  <View style={styles.debtHeader}>
                    <Text style={styles.debtPerson}>{getPersonName(d.personId)}</Text>
                    <Text style={[styles.debtAmount, { color: d.direction === 'lent' ? theme.colors.success : theme.colors.warning }]}>
                      {formatCurrency(d.remainingAmount)}
                    </Text>
                  </View>
                  <Text style={styles.debtSub}>
                    {d.direction === 'lent' ? 'Owes you' : 'You owe'} · Overdue
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Debts</Text>
        </View>
        
        {activeDebts.length === 0 ? (
          <Text style={styles.emptyText}>No active debts</Text>
        ) : (
          activeDebts.map(d => (
            <TouchableOpacity key={d.id} onPress={() => navigation.navigate('DebtDetail', { debtId: d.id })}>
              <GlassCard style={styles.debtCard}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtPerson}>{getPersonName(d.personId)}</Text>
                  <Text style={[styles.debtAmount, { color: d.direction === 'lent' ? theme.colors.success : theme.colors.warning }]}>
                    {formatCurrency(d.remainingAmount)}
                  </Text>
                </View>
                <Text style={styles.debtSub}>
                  {d.direction === 'lent' ? 'Owes you' : 'You owe'} 
                  {d.dueDate ? ` · Due ${new Date(d.dueDate).toLocaleDateString()}` : ''}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('AddEditPerson', {})} style={{ marginRight: 16 }}>
              <Ionicons name="person-add" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('People')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {people.length === 0 ? (
          <Text style={styles.emptyText}>No people saved</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
            {people.slice(0, 5).map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('PersonDetail', { personId: p.id })}>
                <GlassCard style={styles.personCard}>
                  <View style={[styles.avatar, { backgroundColor: p.avatarColor || theme.colors.primary }]}>
                    <Text style={styles.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.personName}>{p.name}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surfaceLight, padding: 16, borderRadius: 16, marginHorizontal: 6, borderWidth: 1, borderColor: theme.colors.border },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  summaryCard: { flex: 1, marginHorizontal: 6, padding: 16 },
  summaryLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 8 },
  summaryValue: { ...theme.typography.h3, fontWeight: 'bold' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary },
  viewAllText: { ...theme.typography.body2, color: theme.colors.primary, fontWeight: 'bold' },
  
  debtCard: { padding: 16, marginBottom: 12 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  debtPerson: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary },
  debtAmount: { ...theme.typography.h3, fontWeight: 'bold' },
  debtSub: { ...theme.typography.body2, color: theme.colors.textMuted },
  
  emptyText: { ...theme.typography.body2, color: theme.colors.textMuted, fontStyle: 'italic', paddingHorizontal: 4 },
  
  peopleScroll: { paddingVertical: 8 },
  personCard: { padding: 8, paddingRight: 16, marginRight: 12, alignItems: 'center', flexDirection: 'row', borderRadius: 32 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  personName: { ...theme.typography.body2, color: theme.colors.textPrimary, fontWeight: '600' }
});
