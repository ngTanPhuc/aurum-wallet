import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../theme/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GlobalFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (screen: 'AddEditTransaction' | 'AddEditWallet' | 'AddEditBudget' | 'AddEditSavingsGoal') => {
    setIsOpen(false);
    // Use an empty object as params instead of undefined to match the expected signature
    if (screen === 'AddEditTransaction') {
      navigation.navigate('AddEditTransaction', {});
    } else if (screen === 'AddEditWallet') {
      navigation.navigate('AddEditWallet', {});
    } else if (screen === 'AddEditBudget') {
      navigation.navigate('AddEditBudget', {});
    } else {
      navigation.navigate('AddEditSavingsGoal', {});
    }
  };

  return (
    <>
      {isOpen && (
        <Modal transparent visible={isOpen} animationType="fade">
          <TouchableWithoutFeedback onPress={toggleMenu}>
            <View style={styles.overlay}>
              <View style={styles.actionsContainer}>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>New Goal</Text>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleAction('AddEditSavingsGoal')}
                  >
                    <Ionicons name="flag" size={20} color={theme.colors.primary} style={{ marginTop: -2 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>New Budget</Text>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleAction('AddEditBudget')}
                  >
                    <Ionicons name="pie-chart" size={20} color={theme.colors.primary} style={{ marginTop: -2 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>New Recurring</Text>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => {
                      setIsOpen(false);
                      navigation.navigate('AddEditRecurringTransaction', {});
                    }}
                  >
                    <Ionicons name="repeat" size={20} color={theme.colors.primary} style={{ marginTop: -2 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>New Wallet</Text>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleAction('AddEditWallet')}
                  >
                    <Ionicons name="wallet" size={20} color={theme.colors.primary} style={{ marginTop: -2 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>New Transaction</Text>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleAction('AddEditTransaction')}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.primary} style={{ marginTop: -2 }} />
                  </TouchableOpacity>
                </View>
                
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <TouchableOpacity
        style={[styles.fab, isOpen && styles.fabOpen]}
        onPress={toggleMenu}
      >
        <Ionicons name={isOpen ? "close" : "add"} size={32} color={isOpen ? theme.colors.primary : theme.colors.background} style={{ marginTop: -2 }} />
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    zIndex: 100, // Make sure it sits on top
  },
  fabOpen: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  fabIcon: { 
    fontSize: 32, 
    color: theme.colors.background, 
    lineHeight: 34 
  },
  fabIconOpen: {
    fontSize: 38,
    lineHeight: 38,
    transform: [{ rotate: '45deg' }], // Optional nice little rotation
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // theme.colors.background with opacity
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 90,
    paddingBottom: 130,
  },
  actionsContainer: {
    alignItems: 'flex-end',
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: { 
    ...theme.typography.body2, 
    backgroundColor: theme.colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  actionIcon: {
    fontSize: 20,
  }
});
