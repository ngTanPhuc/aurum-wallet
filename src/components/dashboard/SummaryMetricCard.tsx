import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { GlassCard } from '../glass/GlassCard';
import { MoneyDisplay } from '../glass/MoneyDisplay';

interface SummaryMetricCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: 'up' | 'down' | 'neutral';
  colorType?: 'default' | 'positive' | 'negative' | 'neutral';
}

export const SummaryMetricCard: React.FC<SummaryMetricCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  trend,
  colorType = 'default',
}) => {
  return (
    <GlassCard style={styles.card} variant="default">
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {icon && (
          <Ionicons name={icon} size={18} color={theme.colors.textMuted} />
        )}
      </View>
      
      <View style={styles.content}>
        <MoneyDisplay amount={amount} size="large" colorType={colorType} />
        
        {subtitle && (
          <View style={styles.subtitleContainer}>
            {trend === 'up' && <Ionicons name="arrow-up" size={14} color={theme.colors.success} style={styles.trendIcon} />}
            {trend === 'down' && <Ionicons name="arrow-down" size={14} color={theme.colors.danger} style={styles.trendIcon} />}
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.caption,
    flex: 1,
  },
  content: {
    marginTop: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  trendIcon: {
    marginRight: 4,
  },
  subtitle: {
    ...theme.typography.body2,
  },
});
