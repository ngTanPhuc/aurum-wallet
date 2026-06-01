import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Tag } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Tags'>;

export const TagsScreen = ({ navigation }: Props) => {
  const tags = useFinanceStore(state => state.tags);
  const addTag = useFinanceStore(state => state.addTag);
  const updateTag = useFinanceStore(state => state.updateTag);
  const deleteTag = useFinanceStore(state => state.deleteTag);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagName(tag.name);
    } else {
      setEditingTag(null);
      setTagName('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = tagName.trim();
    if (!name) return;

    // Check for duplicates
    const isDuplicate = tags.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTag?.id);
    if (isDuplicate) {
      Alert.alert('Error', 'A tag with this name already exists.');
      return;
    }

    try {
      if (editingTag) {
        await updateTag({ ...editingTag, name });
      } else {
        await addTag({ name, color: '#007bff' });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save tag.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Tag',
      'Are you sure you want to delete this tag? It will be removed from all associated transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTag(id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: Tag }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpenModal(item)}>
        <View style={styles.cardContent}>
          <Text style={styles.tagName}>#{item.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Tags" />
      {tags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🏷️</Text>
          <Text style={styles.emptyText}>No tags saved yet.</Text>
          <Text style={styles.emptySubtext}>Use tags to further categorize your transactions.</Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTag ? 'Edit Tag' : 'New Tag'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tag Name</Text>
            <TextInput
              style={styles.input}
              value={tagName}
              onChangeText={setTagName}
              placeholder="e.g., Vacation"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus={true}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContainer: { padding: theme.spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm, padding: theme.spacing.lg, marginBottom: theme.spacing.md, ...theme.shadows.subtle },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagName: { ...theme.typography.h3, color: theme.colors.primary },
  deleteBtn: { padding: 4 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyText: { ...theme.typography.h3, color: theme.colors.text, marginTop: theme.spacing.lg },
  emptySubtext: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center' },
  
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', ...theme.shadows.subtle },
  fabIcon: { fontSize: 32, color: theme.colors.background, marginTop: -4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg, padding: theme.spacing.xl, width: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { ...theme.typography.h3, color: theme.colors.text },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  input: { ...theme.typography.body1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, marginBottom: theme.spacing.lg, color: theme.colors.text },
  saveBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center' },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
