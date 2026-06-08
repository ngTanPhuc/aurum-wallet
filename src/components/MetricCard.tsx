import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from './glass/GlassCard';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const MetricCard = React.memo(({ title, value, subtitle, icon, color = theme.colors.info, trend }: MetricCardProps) => {
  return (
    <GlassCard style={styles.card} variant="muted">
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        
        {subtitle && (
          <View style={styles.subtitleContainer}>
            {trend === 'up' && <Ionicons name="trending-up" size={16} color={theme.colors.success} style={{ marginLeft: 4 }} />}
            {trend === 'down' && <Ionicons name="trending-down" size={16} color={theme.colors.danger} style={{ marginLeft: 4 }} />}
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginHorizontal: 6,
    ...theme.shadows.medium,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  title: { ...theme.typography.body2, color: theme.colors.textMuted,
    flex: 1,
    fontWeight: '500', },
  content: {
    marginTop: 4,
  },
  value: { ...theme.typography.h2, fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs, },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  subtitle: { ...theme.typography.caption, color: theme.colors.textMuted,
    flex: 1, },
});
