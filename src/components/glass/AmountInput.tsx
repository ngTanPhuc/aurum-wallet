import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface AmountInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AmountInput: React.FC<AmountInputProps> = ({ 
  value, 
  onChangeText, 
  style, 
  containerStyle, 
  ...props 
}) => {
  const handleAddZeros = () => {
    // We only add '000' if there is already some input, 
    // or we can allow it to just be '000' which onChangeText logic might parse as 0.
    // Let's pass '000' appended to current value. The parent's onChangeText will handle formatting.
    const current = value || '';
    onChangeText(current + '000');
  };

  // Extract margins from the passed style so we can apply them to the container instead
  // to ensure the absolute positioned button stays vertically centered on the input field itself.
  const flatStyle = StyleSheet.flatten(style) || {};
  const { marginTop, marginBottom, marginVertical, margin, ...inputStyle } = flatStyle as any;
  
  const margins = {
    ...(marginTop !== undefined && { marginTop }),
    ...(marginBottom !== undefined && { marginBottom }),
    ...(marginVertical !== undefined && { marginVertical }),
    ...(margin !== undefined && { margin }),
  };

  return (
    <View style={[styles.container, margins, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle, { paddingRight: 60 }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        {...props}
      />
      <TouchableOpacity 
        style={styles.btn} 
        onPress={handleAddZeros} 
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>000</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    // paddingRight is injected inline to avoid conflicts with passed padding
  },
  btn: {
    position: 'absolute',
    right: 8,
    backgroundColor: theme.colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    ...theme.typography.labelCaps,
    color: theme.colors.primary,
  }
});
