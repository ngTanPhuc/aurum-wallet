import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export const PinLockScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PIN Lock is coming soon.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  text: { ...theme.typography.body1, color: theme.colors.textMuted },
});
