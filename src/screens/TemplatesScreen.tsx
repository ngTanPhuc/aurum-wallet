import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Templates'>;

export const TemplatesScreen = ({ navigation }: Props) => {
  const templates = useFinanceStore(state => state.templates);
  const deleteTemplate = useFinanceStore(state => state.deleteTemplate);
  const wallets = useFinanceStore(state => state.wallets);
  const categories = useFinanceStore(state => state.categories);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(id) }
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const renderItem = ({ item }: { item: any }) => {
    const wallet = wallets.find(w => w.id === item.walletId);
    const category = categories.find(c => c.id === item.categoryId);

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddEditTemplate', { templateId: item.id })}>
        <View style={styles.cardHeader}>
          <Text style={styles.templateName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash" size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          <Text style={styles.amountText}>{formatAmount(item.amount)} ₫</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>Wallet: {wallet?.name || 'Unknown'}</Text>
          {category && <Text style={styles.metaText}>Category: {category.name}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Templates" />
      {templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No templates saved yet.</Text>
          <Text style={styles.emptySubtext}>Save a template while adding a new transaction.</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddEditTemplate', {})}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContainer: { padding: theme.spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, ...theme.shadows.subtle },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  templateName: { ...theme.typography.h3, color: theme.colors.textPrimary },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  typeText: { ...theme.typography.caption, fontWeight: 'bold', color: theme.colors.primary, backgroundColor: theme.colors.surfaceStrong, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  amountText: { ...theme.typography.h3, fontWeight: '600', color: theme.colors.textPrimary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { ...theme.typography.caption, color: theme.colors.textMuted },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyText: { ...theme.typography.h3, color: theme.colors.textPrimary, marginTop: theme.spacing.lg },
  emptySubtext: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', ...theme.shadows.subtle },
  fabIcon: { fontSize: 32, color: theme.colors.background, marginTop: -4 }
});
