import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface CustomKeypadProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onClose: () => void;
}

export const CustomKeypad: React.FC<CustomKeypadProps> = ({ isVisible, onKeyPress, onClose }) => {
  const renderButton = (key: string, label?: React.ReactNode, flex = 1) => (
    <TouchableOpacity 
      style={[styles.keyButton, { flex }]} 
      onPress={() => onKeyPress(key)}
      activeOpacity={0.6}
    >
      {typeof label === 'string' || !label ? (
        <Text style={styles.keyText}>{label || key}</Text>
      ) : (
        label
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={styles.keypadContainer}>
        <View style={styles.row}>
          {renderButton('1')}
          {renderButton('2')}
          {renderButton('3')}
        </View>
        <View style={styles.row}>
          {renderButton('4')}
          {renderButton('5')}
          {renderButton('6')}
        </View>
        <View style={styles.row}>
          {renderButton('7')}
          {renderButton('8')}
          {renderButton('9')}
        </View>
        <View style={styles.row}>
          {renderButton('000')}
          {renderButton('0')}
          {renderButton('BACKSPACE', <Ionicons name="backspace-outline" size={24} color={theme.colors.textPrimary} />)}
        </View>
        <View style={styles.row}>
          {renderButton('DONE', 'Done', 1)}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  keypadContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.backgroundAlt,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 40,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  keyButton: {
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorderMuted,
  },
  keyText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  }
});
