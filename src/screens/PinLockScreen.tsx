import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PinService } from '../services/PinService';
import { useSettingsStore } from '../store/useSettingsStore';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PinLock'>;

const PIN_LENGTH = 4;

export const PinLockScreen = ({ navigation, route }: Props) => {
  const { mode } = route.params;
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const togglePin = useSettingsStore(state => state.togglePin);

  const handlePress = useCallback(async (digit: string) => {
    setError('');
    
    if (mode === 'create' && step === 'confirm') {
      const newPin = confirmPin + digit;
      if (newPin.length === PIN_LENGTH) {
        if (newPin === pin) {
          await togglePin(newPin);
          navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
        } else {
          setError('PINs do not match');
          setConfirmPin('');
        }
      } else {
        setConfirmPin(newPin);
      }
    } else {
      const newPin = pin + digit;
      if (newPin.length === PIN_LENGTH) {
        if (mode === 'create') {
          setPin(newPin);
          setStep('confirm');
        } else if (mode === 'verify') {
          const valid = await PinService.verifyPin(newPin);
          if (valid) {
            navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
          } else {
            setError('Wrong PIN');
            setPin('');
          }
        } else if (mode === 'remove') {
          const valid = await PinService.verifyPin(newPin);
          if (valid) {
            await togglePin();
            navigation.goBack();
          } else {
            setError('Wrong PIN');
            setPin('');
          }
        }
      } else {
        setPin(newPin);
      }
    }
  }, [pin, confirmPin, step, mode, navigation, togglePin]);

  const handleDelete = useCallback(() => {
    if (mode === 'create' && step === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
    setError('');
  }, [mode, step]);

  const currentPin = mode === 'create' && step === 'confirm' ? confirmPin : pin;

  const getTitle = () => {
    if (mode === 'create') {
      return step === 'enter' ? 'Create PIN' : 'Confirm PIN';
    }
    if (mode === 'verify') return 'Enter PIN';
    return 'Enter Current PIN';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>Enter {PIN_LENGTH}-digit PIN</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.dot, i < currentPin.length && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['', '0', '']].map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              key ? (
                <TouchableOpacity
                  key={ki}
                  style={styles.key}
                  onPress={() => handlePress(key)}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ) : (
                <View key={ki} style={styles.keyPlaceholder} />
              )
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>DELETE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
    marginBottom: 32,
  },
  error: {
    ...theme.typography.body2,
    color: theme.colors.danger,
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 48,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dotFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPlaceholder: {
    width: 72,
    height: 72,
  },
  keyText: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  deleteBtn: {
    marginTop: 32,
    padding: 12,
  },
  deleteText: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});