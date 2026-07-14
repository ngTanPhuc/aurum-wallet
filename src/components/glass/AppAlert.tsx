import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView
} from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
};

// Singleton ref — set once when <AppAlert /> mounts
let _setState: ((s: AlertState) => void) | null = null;

/**
 * Drop-in replacement for React Native's Alert.alert().
 * Works imperatively from anywhere — no hooks or state needed at call site.
 *
 * Usage:
 *   appAlert('Title', 'Message')
 *   appAlert('Delete?', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => doDelete() }
 *   ])
 */
export function appAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
) {
  if (!_setState) {
    // Fallback if AppAlert hasn't mounted yet (shouldn't happen in practice)
    console.warn('[AppAlert] not mounted, falling back to console');
    console.warn(`[Alert] ${title}: ${message}`);
    return;
  }
  _setState({
    visible: true,
    title,
    message,
    buttons: buttons ?? [{ text: 'OK', style: 'default' }],
  });
}

const EMPTY: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
};

const iconForTitle = (title: string): { name: any; color: string } => {
  const t = title.toLowerCase();
  if (t.includes('error') || t.includes('failed') || t.includes('invalid'))
    return { name: 'alert-circle-outline', color: theme.colors.danger ?? '#ef4444' };
  if (t.includes('delete') || t.includes('remove') || t.includes('destructive'))
    return { name: 'trash-outline', color: '#ef4444' };
  if (t.includes('success') || t.includes('complete') || t.includes('✅'))
    return { name: 'checkmark-circle-outline', color: theme.colors.success };
  if (t.includes('warning') || t.includes('caution') || t.includes('⚠'))
    return { name: 'warning-outline', color: '#fbbf24' };
  if (t.includes('📍') || t.includes('baseline') || t.includes('info'))
    return { name: 'information-circle-outline', color: theme.colors.primary };
  if (t.includes('sync') || t.includes('corrected'))
    return { name: 'sync-circle-outline', color: theme.colors.primary };
  return { name: 'information-circle-outline', color: theme.colors.primary };
};

export const AppAlert: React.FC = () => {
  const [state, setState] = React.useState<AlertState>(EMPTY);

  React.useEffect(() => {
    _setState = setState;
    return () => { _setState = null; };
  }, []);

  const dismiss = () => setState(EMPTY);

  const handleButton = (btn: AlertButton) => {
    dismiss();
    btn.onPress?.();
  };

  if (!state.visible) return null;

  const icon = iconForTitle(state.title);

  return (
    <Modal visible={state.visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: icon.color + '18' }]}>
            <Ionicons name={icon.name} size={28} color={icon.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{state.title}</Text>

          {/* Message */}
          <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.message}>{state.message}</Text>
          </ScrollView>

          {/* Buttons */}
          <View style={[
            styles.buttonRow,
            state.buttons.length === 1 && styles.singleButton,
          ]}>
            {state.buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isDestructive && styles.btnDestructive,
                    isCancel && styles.btnCancel,
                    !isDestructive && !isCancel && styles.btnPrimary,
                  ]}
                  onPress={() => handleButton(btn)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.btnText,
                    isDestructive && styles.btnTextDestructive,
                    isCancel && styles.btnTextCancel,
                    !isDestructive && !isCancel && styles.btnTextPrimary,
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    padding: theme.spacing.xl,
  },
  box: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  messageScroll: {
    maxHeight: 160,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  message: {
    ...theme.typography.body1,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  singleButton: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  btnDestructive: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  btnText: {
    ...theme.typography.body1,
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: '#000',
  },
  btnTextCancel: {
    color: theme.colors.textPrimary,
  },
  btnTextDestructive: {
    color: '#ef4444',
  },
});
