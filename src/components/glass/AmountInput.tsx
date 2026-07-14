import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';
import { useKeypad } from '../../context/KeypadContext';

interface AmountInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  allowDecimal?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({ 
  value, 
  onChangeText, 
  style, 
  containerStyle, 
  maxLength,
  allowDecimal,
  ...props 
}) => {
  const { showKeypad } = useKeypad();
  const viewRef = useRef<View>(null);

  const handleFocus = () => {
    showKeypad({
      initialValue: value,
      onChange: onChangeText,
      maxLength,
      allowDecimal,
      inputRef: viewRef
    });
  };

  const flatStyle = StyleSheet.flatten(style) || {};
  const { marginTop, marginBottom, marginVertical, margin, ...inputStyle } = flatStyle as any;
  
  const margins = {
    ...(marginTop !== undefined && { marginTop }),
    ...(marginBottom !== undefined && { marginBottom }),
    ...(marginVertical !== undefined && { marginVertical }),
    ...(margin !== undefined && { margin }),
  };

  return (
    <View ref={viewRef} collapsable={false} style={[styles.container, margins, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        showSoftInputOnFocus={false}
        onFocus={handleFocus}
        onPressIn={handleFocus}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    // paddingRight removed since we no longer have the inline button
  },
});
