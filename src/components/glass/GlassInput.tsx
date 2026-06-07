import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface GlassInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textDisabled}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md, // 16px
    height: 56,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  input: {
    ...theme.typography.body1,
    flex: 1,
    height: '100%',
  },
  errorText: {
    ...theme.typography.body2,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  }
});
