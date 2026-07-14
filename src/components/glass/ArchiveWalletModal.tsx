import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { GlassButton } from './GlassButton';

export interface ArchiveDependencies {
  recurringCount: number;
  hasYieldPocket: boolean;
  savingsGoalsCount: number;
}

export interface ArchiveResolutions {
  cancelRecurring: boolean;
  stopYieldPocket: boolean;
  unlinkGoals: boolean;
}

interface Props {
  visible: boolean;
  walletName: string;
  dependencies: ArchiveDependencies;
  onConfirm: (resolutions: ArchiveResolutions) => void;
  onCancel: () => void;
}

export const ArchiveWalletModal = ({ visible, walletName, dependencies, onConfirm, onCancel }: Props) => {
  const [resolutions, setResolutions] = useState<ArchiveResolutions>({
    cancelRecurring: true,
    stopYieldPocket: true,
    unlinkGoals: true,
  });

  const toggleResolution = (key: keyof ArchiveResolutions) => {
    setResolutions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasDependencies = 
    dependencies.recurringCount > 0 || 
    dependencies.hasYieldPocket || 
    dependencies.savingsGoalsCount > 0;

  const renderCheckbox = (label: string, key: keyof ArchiveResolutions, visible: boolean) => {
    if (!visible) return null;
    const isChecked = resolutions[key];
    
    return (
      <TouchableOpacity 
        style={styles.checkboxRow} 
        onPress={() => toggleResolution(key)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isChecked ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isChecked ? theme.colors.primary : theme.colors.textMuted} 
        />
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="archive" size={32} color={theme.colors.warning} />
          </View>
          
          <Text style={styles.title}>Archive {walletName}?</Text>
          
          {!hasDependencies ? (
            <Text style={styles.message}>
              Are you sure you want to archive this wallet? It will be hidden from your main balances, but its history will remain in your transactions.
            </Text>
          ) : (
            <>
              <Text style={styles.message}>
                This wallet is tied to active features. Choose how to handle them:
              </Text>
              
              <ScrollView style={styles.optionsList}>
                {renderCheckbox(`Cancel ${dependencies.recurringCount} recurring transaction(s)`, 'cancelRecurring', dependencies.recurringCount > 0)}
                {renderCheckbox('Stop active Yield Pocket', 'stopYieldPocket', dependencies.hasYieldPocket)}
                {renderCheckbox(`Unlink ${dependencies.savingsGoalsCount} savings goal(s)`, 'unlinkGoals', dependencies.savingsGoalsCount > 0)}
              </ScrollView>
              
              <Text style={styles.warningNote}>
                Unchecked items will remain active and tied to this wallet even while archived.
              </Text>
            </>
          )}

          <View style={styles.actions}>
            <GlassButton 
              label="Cancel" 
              onPress={onCancel} 
              variant="secondary"
              style={styles.actionBtn}
            />
            <GlassButton 
              label="Archive" 
              onPress={() => onConfirm(resolutions)} 
              variant="danger"
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,12,23,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionsList: {
    maxHeight: 200,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  checkboxLabel: {
    ...theme.typography.body1,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  warningNote: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
