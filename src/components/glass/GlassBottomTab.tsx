import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export function GlassBottomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let iconName: keyof typeof Ionicons.glyphMap = 'help';
        if (route.name === 'Dashboard') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Transactions') {
          iconName = isFocused ? 'list' : 'list-outline';
        } else if (route.name === 'Wallets') {
          iconName = isFocused ? 'wallet' : 'wallet-outline';
        } else if (route.name === 'Plan') {
          iconName = isFocused ? 'compass' : 'compass-outline';
        } else if (route.name === 'Insights') {
          iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? theme.colors.primary : theme.colors.textMuted} 
              />
            </View>
            <Text style={[styles.label, { color: isFocused ? theme.colors.primary : theme.colors.textMuted }]}>
              {options.title || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radii.xxl,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl, // Floating above the bottom edge
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 16,
  },
  iconContainerFocused: {
    // Removed background color per user request
  },
  label: {
    ...theme.typography.caption,
    marginTop: 2,
    fontSize: 10,
  }
});
