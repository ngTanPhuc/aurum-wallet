import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

interface CustomHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const CustomHeader = ({ title, showBack = false, rightAction }: CustomHeaderProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: 60 + insets.top }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {rightAction && (
        <View style={styles.rightContainer}>
          {rightAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: theme.spacing.lg,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '300',
  },
  title: { ...theme.typography.h3, color: theme.colors.textPrimary,
    flex: 1, },
  rightContainer: {
    marginLeft: theme.spacing.md,
  },
});
