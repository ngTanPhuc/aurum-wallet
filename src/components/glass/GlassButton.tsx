import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

interface GlassButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  label,
  variant = 'primary',
  isLoading = false,
  style,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[styles.baseButton, isDisabled && styles.disabled, style]}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={[theme.colors.goldLight, theme.colors.primary]}
          style={styles.gradientFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.primaryText}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary or Danger Glass variants
  const isDanger = variant === 'danger';
  
  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        styles.glassButton,
        isDanger && { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerBg },
        isDisabled && styles.disabled,
        style
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isDanger ? theme.colors.danger : theme.colors.textPrimary} />
      ) : (
        <Text style={[styles.secondaryText, isDanger && { color: theme.colors.danger }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 56,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientFill: {
    ...StyleSheet.absoluteFill as object,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassButton: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  primaryText: {
    ...theme.typography.body1,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.background,
  },
  secondaryText: {
    ...theme.typography.body1,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
