import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { appAlert } from '../components/glass/AppAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Category, CategoryType } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';
import uuid from 'react-native-uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

// Curated icon set for categories
const AVAILABLE_ICONS = [
  'fast-food', 'cafe', 'cart', 'bus', 'bag', 'film', 'book', 'medkit',
  'home', 'flash', 'phone-portrait', 'airplane', 'gift', 'repeat', 'cube',
  'wallet', 'laptop', 'cash', 'trending-up', 'arrow-undo', 'car', 'bicycle',
  'barbell', 'paw', 'musical-notes', 'game-controller', 'pizza', 'beer',
  'shirt', 'school', 'heart', 'star', 'briefcase', 'restaurant', 'tv',
  'glasses', 'flower', 'leaf', 'ribbon', 'diamond', 'hammer', 'brush',
];

const SYSTEM_CATEGORIES = [
  'Lending', 'Debt Payment', 'Borrowed Money', 'Debt Repayment', 'Yield Interest',
];

export const CategoriesScreen = ({ navigation }: Props) => {
  const categories = useFinanceStore(state => state.categories);
  const addCategory = useFinanceStore(state => state.addCategory);
  const updateCategory = useFinanceStore(state => state.updateCategory);
  const deleteCategory = useFinanceStore(state => state.deleteCategory);

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [modalVisible, setModalVisible] = useState(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cube');

  const filtered = useMemo(
    () => categories.filter(c => c.type === activeTab && !c.isArchived),
    [categories, activeTab],
  );

  const isSystemCategory = (cat: Category) =>
    cat.isDefault && SYSTEM_CATEGORIES.includes(cat.name);

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setIcon('cube');
    setModalVisible(true);
  };

  const openEdit = (cat: Category) => {
    if (isSystemCategory(cat)) {
      appAlert('System Category', 'This category is used internally by the app and cannot be edited.');
      return;
    }
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || 'cube');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      appAlert('Validation', 'Please enter a category name.');
      return;
    }

    const duplicate = categories.some(
      c =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        c.type === activeTab &&
        c.id !== editingCategory?.id,
    );
    if (duplicate) {
      appAlert('Duplicate', 'A category with this name already exists.');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingCategory) {
        await updateCategory({ ...editingCategory, name: trimmed, icon, updatedAt: now });
      } else {
        await addCategory({
          id: uuid.v4() as string,
          name: trimmed,
          type: activeTab,
          icon,
          isDefault: false,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      setModalVisible(false);
    } catch {
      appAlert('Error', 'Failed to save category.');
    }
  };

  const handleDelete = (cat: Category) => {
    if (isSystemCategory(cat)) {
      appAlert('System Category', 'This category is used internally by the app and cannot be deleted.');
      return;
    }
    appAlert(
      'Delete Category',
      `Delete "${cat.name}"? Existing transactions using it will keep the category reference but it will no longer appear in pickers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(cat.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Category }) => {
    const isSystem = isSystemCategory(item);
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={[styles.iconBadge, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={(item.icon || 'cube') as any} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          {isSystem && (
            <Text style={styles.systemBadge}>system</Text>
          )}
          {item.isDefault && !isSystem && (
            <Text style={styles.defaultBadge}>default</Text>
          )}
        </View>
        {!isSystem && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Categories" showBack={true} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
          onPress={() => setActiveTab('expense')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={16}
            color={activeTab === 'expense' ? theme.colors.danger : theme.colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.tabActive]}
          onPress={() => setActiveTab('income')}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={16}
            color={activeTab === 'income' ? theme.colors.success : theme.colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActiveIncome]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No categories yet.</Text>
          <Text style={styles.emptySubtext}>Tap + to create your first {activeTab} category.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color={theme.colors.background} />
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : `New ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Icon preview + picker trigger */}
            <Text style={styles.fieldLabel}>Icon</Text>
            <TouchableOpacity
              style={styles.iconSelector}
              onPress={() => setIconPickerVisible(true)}
            >
              <View style={[styles.iconPreview, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.iconSelectorText}>Tap to change icon</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {/* Name input */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Hobby"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus={!editingCategory}
              maxLength={30}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Icon picker modal */}
      <Modal visible={iconPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick an Icon</Text>
              <TouchableOpacity onPress={() => setIconPickerVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.iconGrid}>
              {AVAILABLE_ICONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconGridItem, ic === icon && styles.iconGridItemActive]}
                  onPress={() => {
                    setIcon(ic);
                    setIconPickerVisible(false);
                  }}
                >
                  <Ionicons
                    name={ic as any}
                    size={22}
                    color={ic === icon ? theme.colors.background : theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  tabText: { ...theme.typography.body2, color: theme.colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: theme.colors.danger, fontWeight: '700' },
  tabTextActiveIncome: { color: theme.colors.success, fontWeight: '700' },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorderMuted,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { ...theme.typography.body1, color: theme.colors.textPrimary },
  systemBadge: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  defaultBadge: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: { padding: 4 },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { ...theme.typography.h3, color: theme.colors.textPrimary, marginTop: 16 },
  emptySubtext: { ...theme.typography.body2, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 12, 23, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundAlt,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: { ...theme.typography.h3, color: theme.colors.textPrimary },

  // Form
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorderMuted,
  },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconSelectorText: { ...theme.typography.body1, color: theme.colors.textPrimary, flex: 1 },
  input: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorderMuted,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
  },
  saveBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: '700' },

  // Icon grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: theme.spacing.sm,
  },
  iconGridItem: {
    width: '16.66%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.sm,
    marginBottom: 4,
  },
  iconGridItemActive: {
    backgroundColor: theme.colors.primary,
  },
});
