import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface GlassCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'muted';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  style, 
  children, 
  variant = 'default',
  ...props 
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'strong': return theme.colors.surfaceStrong;
      case 'muted': return theme.colors.surfaceMuted;
      default: return theme.colors.surface;
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor() },
        style
      ]} 
      {...props}
    >
      {/* Subtle top inner highlight to simulate glass edge */}
      <View style={styles.topHighlight} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  }
});
