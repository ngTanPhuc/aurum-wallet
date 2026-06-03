import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { CustomKeypad } from '../components/glass/CustomKeypad';

type KeypadConfig = {
  initialValue: string;
  onChange: (val: string) => void;
  maxLength?: number;
  inputRef?: React.RefObject<View | null>;
};

interface KeypadContextProps {
  showKeypad: (config: KeypadConfig) => void;
  hideKeypad: () => void;
  isKeypadVisible: boolean;
}

const KeypadContext = createContext<KeypadContextProps | undefined>(undefined);

export const KeypadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appTranslateY = useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = useState(false);
  const [value, setValue] = useState('');
  const [onChangeCallback, setOnChangeCallback] = useState<(val: string) => void>(() => () => {});
  const [maxLength, setMaxLength] = useState<number | undefined>();

  const showKeypad = (config: KeypadConfig) => {
    setValue(config.initialValue);
    setOnChangeCallback(() => config.onChange);
    setMaxLength(config.maxLength);
    setIsVisible(true);

    if (config.inputRef && config.inputRef.current) {
      setTimeout(() => {
        config.inputRef?.current?.measureInWindow((x, y, width, height) => {
          const keypadHeight = 420; // Safe height
          const screenHeight = Dimensions.get('window').height;
          const bottomOfInput = y + height;
          const topOfKeypad = screenHeight - keypadHeight;
          
          if (bottomOfInput > topOfKeypad) {
            const shift = bottomOfInput - topOfKeypad + 40; // extra padding
            Animated.timing(appTranslateY, {
              toValue: -shift,
              duration: 250,
              useNativeDriver: true
            }).start();
          }
        });
      }, 50); // slight delay to ensure layout is stable
    }
  };

  const hideKeypad = () => {
    setIsVisible(false);
    Animated.timing(appTranslateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start();
  };

  const handleKeyPress = (key: string) => {
    let newValue = value;

    if (key === 'BACKSPACE') {
      newValue = newValue.slice(0, -1);
    } else if (key === 'DONE') {
      hideKeypad();
      return;
    } else {
      // For '.' we must ensure we don't add multiple dots if already present, but the raw values
      // handled by Aurum Wallet's inputs usually strip non-digits or manage formatting internally.
      // However, we send raw characters and let the caller component format them, 
      // or we handle raw string construction here.
      if (maxLength && newValue.length >= maxLength) return;
      newValue = newValue + key;
    }

    setValue(newValue);
    onChangeCallback(newValue);
  };

  return (
    <KeypadContext.Provider value={{ showKeypad, hideKeypad, isKeypadVisible: isVisible }}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: appTranslateY }] }}>
        {children}
      </Animated.View>
      <CustomKeypad 
        isVisible={isVisible} 
        onKeyPress={handleKeyPress} 
        onClose={hideKeypad} 
      />
    </KeypadContext.Provider>
  );
};

export const useKeypad = () => {
  const context = useContext(KeypadContext);
  if (!context) {
    throw new Error('useKeypad must be used within a KeypadProvider');
  }
  return context;
};
