import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { GlassCard } from '../glass/GlassCard';

interface FeatureTileProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accentColor?: string;
}

export const FeatureTile: React.FC<FeatureTileProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  accentColor = theme.colors.primary,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <TouchableWithoutFeedback 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
        <GlassCard style={styles.card} variant="strong">
          <View style={[styles.iconBox, { backgroundColor: accentColor + '1A' }]}>
            <Ionicons name={icon} size={24} color={accentColor} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={styles.arrow} />
        </GlassCard>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.body1,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
  },
  arrow: {
    marginLeft: theme.spacing.sm,
  },
});
