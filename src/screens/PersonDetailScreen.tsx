import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Debt } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

export const PersonDetailScreen = ({ navigation, route }: Props) => {
  const { personId } = route.params;
  const { people, debts, deletePerson } = useFinanceStore();
  const defaultCurrency = useSettingsStore(state => state.settings.defaultCurrency);

  const person = people.find(p => p.id === personId);
  
  const personDebts = useMemo(() => debts.filter(d => d.personId === personId), [debts, personId]);
  
  const { activeDebts, paidDebts, totalOwedToMe, totalIOwe } = useMemo(() => {
    const active: Debt[] = [];
    const paid: Debt[] = [];
    let owedToMe = 0;
    let iOwe = 0;

    personDebts.forEach(d => {
      if (d.status === 'paid' || d.status === 'cancelled') {
        paid.push(d);
      } else {
        active.push(d);
        if (d.direction === 'lent') owedToMe += d.remainingAmount;
        if (d.direction === 'borrowed') iOwe += d.remainingAmount;
      }
    });

    return { activeDebts: active, paidDebts: paid, totalOwedToMe: owedToMe, totalIOwe: iOwe };
  }, [personDebts]);

  if (!person) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Person Not Found" showBack={true} />
      </View>
    );
  }

  const formatCurrency = (val: number) => `${val.toLocaleString()} ${defaultCurrency}`;

  const handleDelete = () => {
    if (personDebts.length > 0) {
      appAlert('Cannot Delete', 'This person has associated debts. Please delete or archive the debts first.');
      return;
    }
    appAlert('Delete Person', `Are you sure you want to delete ${person.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deletePerson(person.id);
        navigation.goBack();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <CustomHeader 
        title={person.name} 
        showBack={true} 
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('AddEditPerson', { personId: person.id })}>
            <Ionicons name="pencil" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.heroCard}>
          <View style={[styles.avatar, { backgroundColor: person.avatarColor || theme.colors.primary }]}>
            <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.personName}>{person.name}</Text>
          {person.phone && <Text style={styles.personContact}><Ionicons name="call" size={14} /> {person.phone}</Text>}
          {person.email && <Text style={styles.personContact}><Ionicons name="mail" size={14} /> {person.email}</Text>}
          {person.note && <Text style={styles.personNote}>{person.note}</Text>}
        </GlassCard>

        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>They owe you</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{formatCurrency(totalOwedToMe)}</Text>
          </GlassCard>
          <View style={{ width: 12 }} />
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>You owe them</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{formatCurrency(totalIOwe)}</Text>
          </GlassCard>
        </View>

        {activeDebts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Debts</Text>
            {activeDebts.map(d => (
              <TouchableOpacity key={d.id} onPress={() => navigation.navigate('DebtDetail', { debtId: d.id })}>
                <GlassCard style={styles.debtCard}>
                  <View style={styles.debtHeader}>
                    <Text style={styles.debtTitle}>{d.direction === 'lent' ? 'Lent' : 'Borrowed'}</Text>
                    <Text style={[styles.debtAmount, { color: d.direction === 'lent' ? theme.colors.success : theme.colors.warning }]}>
                      {formatCurrency(d.remainingAmount)}
                    </Text>
                  </View>
                  <Text style={styles.debtSub}>Started: {new Date(d.startDate).toLocaleDateString()}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        {paidDebts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past Debts</Text>
            {paidDebts.map(d => (
              <TouchableOpacity key={d.id} onPress={() => navigation.navigate('DebtDetail', { debtId: d.id })}>
                <GlassCard style={[styles.debtCard, { opacity: 0.7 }]}>
                  <View style={styles.debtHeader}>
                    <Text style={styles.debtTitle}>{d.direction === 'lent' ? 'Lent' : 'Borrowed'} (Paid)</Text>
                    <Text style={styles.debtAmount}>{formatCurrency(d.principalAmount)}</Text>
                  </View>
                  <Text style={styles.debtSub}>Started: {new Date(d.startDate).toLocaleDateString()}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Person</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  
  heroCard: { padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  personName: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: 8 },
  personContact: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 4 },
  personNote: { ...theme.typography.body2, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  
  summaryRow: { flexDirection: 'row', marginBottom: 24 },
  summaryCard: { flex: 1, padding: 16, alignItems: 'center' },
  summaryLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 8 },
  summaryValue: { ...theme.typography.h3, fontWeight: 'bold' },

  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 12, marginLeft: 4 },
  debtCard: { padding: 16, marginBottom: 12 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  debtTitle: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary },
  debtAmount: { ...theme.typography.body1, fontWeight: 'bold' },
  debtSub: { ...theme.typography.body2, color: theme.colors.textMuted },
  
  deleteBtn: { marginTop: 24, padding: 16, alignItems: 'center' },
  deleteBtnText: { ...theme.typography.body2, color: theme.colors.danger, fontWeight: 'bold' }
});
