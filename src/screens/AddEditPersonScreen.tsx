import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Person } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import uuid from 'react-native-uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditPerson'>;

const COLORS = [
  theme.colors.primary,
  theme.colors.success,
  theme.colors.warning,
  theme.colors.danger,
  theme.colors.info,
  '#9c27b0', // purple
  '#e91e63', // pink
  '#795548'  // brown
];

export const AddEditPersonScreen = ({ navigation, route }: Props) => {
  const { personId } = route.params;
  const { people, addPerson, updatePerson } = useFinanceStore();

  const existingPerson = people.find(p => p.id === personId);

  const [name, setName] = useState(existingPerson?.name || '');
  const [phone, setPhone] = useState(existingPerson?.phone || '');
  const [email, setEmail] = useState(existingPerson?.email || '');
  const [note, setNote] = useState(existingPerson?.note || '');
  const [avatarColor, setAvatarColor] = useState(existingPerson?.avatarColor || COLORS[0]);

  const handleSave = async () => {
    if (!name.trim()) return appAlert('Error', 'Name is required.');

    const now = new Date().toISOString();
    
    if (existingPerson) {
      const p: Person = {
        ...existingPerson,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
        avatarColor,
        updatedAt: now
      };
      await updatePerson(p);
    } else {
      const p: Person = {
        id: uuid.v4() as string,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
        avatarColor,
        isArchived: false,
        createdAt: now,
        updatedAt: now
      };
      await addPerson(p);
    }
    
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={existingPerson ? 'Edit Person' : 'Add Person'} showBack={true} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.textMuted}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Phone (Optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+1 234 567 8900"
            placeholderTextColor={theme.colors.textMuted}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="john@example.com"
            placeholderTextColor={theme.colors.textMuted}
          />
          
          <Text style={[styles.label, { marginTop: 16 }]}>Avatar Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity 
                key={c} 
                style={[styles.colorBubble, { backgroundColor: c }, avatarColor === c && styles.colorBubbleSelected]} 
                onPress={() => setAvatarColor(c)} 
              />
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.colors.textMuted}
            multiline
          />
        </GlassCard>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 8 },
  input: { ...theme.typography.body1, color: theme.colors.textPrimary, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorBubble: { width: 36, height: 36, borderRadius: 18, opacity: 0.5 },
  colorBubbleSelected: { opacity: 1, borderWidth: 2, borderColor: '#fff' },

  saveBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { ...theme.typography.body1, color: '#fff', fontWeight: 'bold' }
});
