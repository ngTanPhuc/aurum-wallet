import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { TransactionFilters, TransactionSort } from '../types';
import { theme } from '../theme/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal = ({ visible, onClose }: Props) => {
  const storeFilters = useFinanceStore(state => state.transactionFilters);
  const storeSort = useFinanceStore(state => state.transactionSort);
  const setTransactionFilters = useFinanceStore(state => state.setTransactionFilters);
  const setTransactionSort = useFinanceStore(state => state.setTransactionSort);

  const categories = useFinanceStore(state => state.categories);
  const wallets = useFinanceStore(state => state.wallets);
  const tags = useFinanceStore(state => state.tags);

  const [filters, setFilters] = useState<TransactionFilters>(storeFilters);
  const [sort, setSort] = useState<TransactionSort>(storeSort);

  useEffect(() => {
    if (visible) {
      setFilters(storeFilters);
      setSort(storeSort);
    }
  }, [visible, storeFilters, storeSort]);

  const handleApply = () => {
    setTransactionFilters(filters);
    setTransactionSort(sort);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    setSort('newest');
  };

  const toggleArrayItem = (key: keyof TransactionFilters, val: string) => {
    const currentArray = (filters[key] as string[]) || [];
    if (currentArray.includes(val)) {
      setFilters({ ...filters, [key]: currentArray.filter(i => i !== val) });
    } else {
      setFilters({ ...filters, [key]: [...currentArray, val] });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearBtn}>Clear All</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {/* Sort */}
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.rowWrap}>
              {(['newest', 'oldest', 'highest_amount', 'lowest_amount'] as TransactionSort[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, sort === s && styles.pillActive]}
                  onPress={() => setSort(s)}
                >
                  <Text style={[styles.pillText, sort === s && styles.pillTextActive]}>
                    {s.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Types */}
            <Text style={styles.sectionTitle}>Types</Text>
            <View style={styles.rowWrap}>
              {['expense', 'income', 'transfer'].map(t => {
                const isActive = (filters.types || []).includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => toggleArrayItem('types', t)}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Wallets */}
            <Text style={styles.sectionTitle}>Wallets</Text>
            <View style={styles.rowWrap}>
              {wallets.map(w => {
                const isActive = (filters.walletIds || []).includes(w.id);
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => toggleArrayItem('walletIds', w.id)}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories */}
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.rowWrap}>
              {categories.map(c => {
                const isActive = (filters.categoryIds || []).includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => toggleArrayItem('categoryIds', c.id)}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{c.icon} {c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tags */}
            {tags.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.rowWrap}>
                  {tags.map(tag => {
                    const isActive = (filters.tagIds || []).includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => toggleArrayItem('tagIds', tag.id)}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>#{tag.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'flex-end' },
  content: { backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, padding: theme.spacing.xl, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary },
  clearBtn: { ...theme.typography.body1, color: theme.colors.primary },
  scroll: { maxHeight: 500 },
  sectionTitle: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textMuted, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border },
  pillActive: { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.primary },
  pillText: { ...theme.typography.body2, color: theme.colors.textPrimary },
  pillTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  applyBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.radii.sm, alignItems: 'center', marginTop: theme.spacing.lg },
  applyBtnText: { ...theme.typography.body1, color: theme.colors.background, fontWeight: 'bold' },
});
