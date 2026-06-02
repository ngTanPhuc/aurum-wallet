import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Tag } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';


interface Props {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export const TagPicker = ({ selectedTagIds, onChange }: Props) => {
  const tags = useFinanceStore(state => state.tags);
  const addTag = useFinanceStore(state => state.addTag);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Error', 'A tag with this name already exists.');
      return;
    }

    try {
      await addTag({ name, color: theme.colors.primary });
      setNewTagName('');
    } catch (e) {
      Alert.alert('Error', 'Failed to create tag.');
    }
  };

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      
      <View style={styles.selectedTagsContainer}>
        {selectedTags.map(tag => (
          <TouchableOpacity key={tag.id} style={styles.tagBadge} onPress={() => toggleTag(tag.id)}>
            <Text style={styles.tagBadgeText}>{tag.name}</Text>
            <Ionicons name="close" size={16} color={theme.colors.background} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Tag</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Tags</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.createRow}>
              <TextInput
                style={styles.input}
                value={newTagName}
                onChangeText={setNewTagName}
                placeholder="New Tag Name"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateTag}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tagList}>
              {tags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.tagListItem, isSelected && styles.tagListItemSelected]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Text style={[styles.tagListItemText, isSelected && styles.tagListItemTextSelected]}>
                      #{tag.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  label: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  selectedTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radii.lg },
  tagBadgeText: { ...theme.typography.body2, color: theme.colors.background, fontWeight: '500' },
  addBtn: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radii.lg, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  addBtnText: { ...theme.typography.body2, color: theme.colors.textPrimary, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, padding: theme.spacing.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { ...theme.typography.h2, color: theme.colors.textPrimary },
  
  createRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  input: { ...theme.typography.body1, flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, padding: theme.spacing.md, color: theme.colors.textPrimary },
  createBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg, justifyContent: 'center', borderRadius: theme.radii.sm },
  createBtnText: { color: theme.colors.background, fontWeight: 'bold' },
  
  tagList: { maxHeight: 300 },
  tagListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  tagListItemSelected: { backgroundColor: theme.colors.surfaceStrong, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm },
  tagListItemText: { ...theme.typography.body1, color: theme.colors.textPrimary },
  tagListItemTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },
  
  doneBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  doneBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
