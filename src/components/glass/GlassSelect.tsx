import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Option {
  label: string;
  value: string;
}

interface GlassSelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select an option...', 
  error 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.selector, error ? styles.selectorError : null]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedOption ? styles.selectedText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.item}
                  onPress={() => {
                    onChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.itemName, value === item.value && styles.itemSelected]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.check} />}
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
    marginBottom: theme.spacing.md,
  },
  label: { 
    ...theme.typography.body2, 
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm, 
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  selectorError: {
    borderColor: theme.colors.danger,
  },
  selectedText: { 
    ...theme.typography.body1, 
    color: theme.colors.textPrimary, 
  },
  placeholderText: { 
    ...theme.typography.body1, 
    color: theme.colors.textMuted, 
  },
  errorText: { 
    ...theme.typography.caption, 
    color: theme.colors.danger,
    marginTop: theme.spacing.xs, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 12, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundAlt,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { 
    ...theme.typography.h3, 
    color: theme.colors.textPrimary, 
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceStrong,
  },
  itemName: { 
    ...theme.typography.body1, 
    color: theme.colors.textPrimary,
  },
  itemSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  check: {
    marginLeft: 8,
  },
});
