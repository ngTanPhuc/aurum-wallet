import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, TextStyle, ViewStyle, Pressable, Animated } from 'react-native';
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
  placeholder = '0',
  placeholderTextColor = theme.colors.textMuted,
  ...props 
}) => {
  const { showKeypad, activeInputId, isKeypadVisible } = useKeypad();
  const viewRef = useRef<View>(null);
  const inputId = useRef(Math.random().toString(36).substring(7)).current;

  const isActive = isKeypadVisible && activeInputId === inputId;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(0);
    }
  }, [isActive]);

  const handleFocus = () => {
    showKeypad({
      id: inputId,
      initialValue: value,
      onChange: onChangeText,
      maxLength,
      allowDecimal,
      inputRef: viewRef
    });
  };

  const flatStyle = (StyleSheet.flatten(style) || {}) as TextStyle;
  const { marginTop, marginBottom, marginVertical, margin, ...inputStyle } = flatStyle as any;
  
  const margins = {
    ...(marginTop !== undefined && { marginTop }),
    ...(marginBottom !== undefined && { marginBottom }),
    ...(marginVertical !== undefined && { marginVertical }),
    ...(margin !== undefined && { margin }),
  };

  const isCentered = inputStyle.textAlign === 'center';
  const fontSize = inputStyle.fontSize || 18;
  const cursorHeight = fontSize * 0.85;
  const cursorColor = inputStyle.color || theme.colors.primary;

  return (
    <Pressable
      ref={viewRef as any}
      onPress={handleFocus}
      style={[styles.container, margins, containerStyle]}
    >
      <View pointerEvents="none" style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          editable={false}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          {...props}
        />
        {isActive && (
          <View 
            style={[
              styles.cursorOverlay, 
              isCentered ? styles.cursorCentered : styles.cursorLeft
            ]}
          >
            {/* Hidden measuring text to position cursor right after the text content */}
            <Text 
              style={[
                styles.measureText, 
                inputStyle, 
                { opacity: 0 }
              ]} 
              numberOfLines={1}
            >
              {value || placeholder}
            </Text>
            <Animated.View
              style={[
                styles.cursor,
                {
                  height: cursorHeight,
                  backgroundColor: cursorColor,
                  opacity: blinkAnim,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    // Standard text input
  },
  cursorOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  cursorLeft: {
    justifyContent: 'flex-start',
  },
  cursorCentered: {
    justifyContent: 'center',
  },
  measureText: {
    // Used to align cursor right after the text
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  cursor: {
    width: 2,
    borderRadius: 1,
    marginLeft: 2,
  },
});

