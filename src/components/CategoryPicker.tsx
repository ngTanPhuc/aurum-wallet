import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { theme } from '../theme/theme';

interface CategoryPickerProps {
  value?: string; // categoryId
  onChange: (categoryId: string) => void;
  typeFilter?: 'income' | 'expense';
  error?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange, typeFilter, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const categories = useFinanceStore(state => state.categories);

  const filteredCategories = typeFilter 
    ? categories.filter(c => c.type === typeFilter && !c.isArchived)
    : categories.filter(c => !c.isArchived);

  const selectedCategory = categories.find(c => c.id === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <TouchableOpacity 
        style={[styles.selector, error ? styles.selectorError : null]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedCategory ? styles.selectedText : styles.placeholderText}>
          {selectedCategory ? selectedCategory.name : 'Select a category'}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredCategories}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.item}
                  onPress={() => {
                    onChange(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
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
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceStrong,
  },
  itemName: { ...theme.typography.body1, color: theme.colors.textPrimary, },
  check: {
    color: theme.colors.primary,
    fontSize: 16,
  },
});
