import React from 'react';
import { View, StyleSheet, SafeAreaView, ViewProps, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

interface AppScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  paddingHorizontal?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({ 
  children, 
  scrollable = false,
  paddingHorizontal = true,
  style, 
  ...props 
}) => {
  const innerStyle = [
    styles.inner,
    paddingHorizontal && styles.paddingHorizontal,
    style
  ];

  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background} />
        <ScrollView contentContainerStyle={innerStyle} {...props}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background} />
      <View style={innerStyle} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  background: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flexGrow: 1,
  },
  paddingHorizontal: {
    paddingHorizontal: theme.spacing.lg,
  }
});
