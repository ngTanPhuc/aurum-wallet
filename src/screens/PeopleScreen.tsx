import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'People'>;

export const PeopleScreen = ({ navigation }: Props) => {
  const { people } = useFinanceStore();

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="People" 
        showBackButton 
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('AddEditPerson', {})}>
            <Ionicons name="add" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {people.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No People Saved</Text>
            <Text style={styles.emptyDesc}>Add people to track who you lend to or borrow from.</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditPerson', {})}>
              <Text style={styles.addBtnText}>Add Person</Text>
            </TouchableOpacity>
          </View>
        ) : (
          people.map(p => (
            <TouchableOpacity key={p.id} onPress={() => navigation.navigate('PersonDetail', { personId: p.id })}>
              <GlassCard style={styles.personCard}>
                <View style={styles.personLeft}>
                  <View style={[styles.avatar, { backgroundColor: p.avatarColor || theme.colors.primary }]}>
                    <Text style={styles.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.personName}>{p.name}</Text>
                    {p.phone && <Text style={styles.personContact}>{p.phone}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  
  personCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 12 },
  personLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  personName: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: 'bold' },
  personContact: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: 2 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyDesc: { ...theme.typography.body1, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  addBtnText: { ...theme.typography.body1, color: '#fff', fontWeight: 'bold' }
});
