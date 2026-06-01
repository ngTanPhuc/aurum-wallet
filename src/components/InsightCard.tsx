import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Insight } from '../types';
import { theme } from '../theme/theme';

interface InsightCardProps {
  insight: Insight;
  onActionPress?: (route: string) => void;
}

export const InsightCard = ({ insight, onActionPress }: InsightCardProps) => {
  const getThemeColors = () => {
    switch (insight.type) {
      case 'alert':
        return { bg: theme.colors.dangerBg, border: theme.colors.danger, text: theme.colors.danger, iconBg: '#450a0a' }; // Red 950
      case 'warning':
        return { bg: theme.colors.warningBg, border: theme.colors.warning, text: theme.colors.warning, iconBg: '#451a03' }; // Amber 950
      case 'success':
        return { bg: theme.colors.successBg, border: theme.colors.success, text: theme.colors.success, iconBg: '#022c22' }; // Emerald 950
      case 'info':
      default:
        return { bg: theme.colors.infoBg, border: theme.colors.info, text: theme.colors.info, iconBg: '#172554' }; // Blue 950
    }
  };

  const colors = getThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.header}>
        {insight.icon && (
          <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
            <Ionicons name={insight.icon as any} size={20} color={colors.text} />
          </View>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{insight.title}</Text>
      </View>
      <Text style={styles.description}>{insight.description}</Text>
      
      {insight.actionLabel && insight.actionRoute && (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.text }]}
          onPress={() => onActionPress && onActionPress(insight.actionRoute!)}
        >
          <Text style={styles.actionText}>{insight.actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
  },
  title: { ...theme.typography.body1, fontWeight: 'bold',
    flex: 1, },
  description: { ...theme.typography.body2, color: theme.colors.textMuted,
    lineHeight: 20, },
  actionButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  actionText: { ...theme.typography.body2, color: theme.colors.background,
    fontWeight: '600', },
});
