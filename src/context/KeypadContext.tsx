import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { CustomKeypad } from '../components/glass/CustomKeypad';

type KeypadConfig = {
  id?: string;
  initialValue: string;
  onChange: (val: string) => void;
  maxLength?: number;
  inputRef?: React.RefObject<View | null>;
  allowDecimal?: boolean;
};

interface KeypadContextProps {
  showKeypad: (config: KeypadConfig) => void;
  hideKeypad: () => void;
  isKeypadVisible: boolean;
  activeInputId: string | null;
  appTranslateY: Animated.Value;
}

const KeypadContext = createContext<KeypadContextProps | undefined>(undefined);

export const KeypadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appTranslateY = useRef(new Animated.Value(0)).current;
  const currentShift = useRef(0);

  const [isVisible, setIsVisible] = useState(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [onChangeCallback, setOnChangeCallback] = useState<(val: string) => void>(() => () => {});
  const [maxLength, setMaxLength] = useState<number | undefined>();
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const showKeypad = (config: KeypadConfig) => {
    setActiveInputId(config.id || null);
    setValue(config.initialValue);
    setOnChangeCallback(() => config.onChange);
    setMaxLength(config.maxLength);
    setAllowDecimal(config.allowDecimal ?? false);
    setIsVisible(true);

    if (config.inputRef && config.inputRef.current) {
      setTimeout(() => {
        config.inputRef?.current?.measure((x, y, width, height, pageX, pageY) => {
          if (pageY === undefined) return;
          
          const keypadHeight = 420; // Safe height
          const screenHeight = Dimensions.get('window').height;
          
          const unshiftedY = pageY + currentShift.current;
          const bottomOfInput = unshiftedY + height;
          const topOfKeypad = screenHeight - keypadHeight;
          
          let newShift = 0;
          if (bottomOfInput > topOfKeypad) {
            newShift = bottomOfInput - topOfKeypad + 95; // adjusted padding
          }
          
          currentShift.current = newShift;
          Animated.timing(appTranslateY, {
            toValue: -newShift,
            duration: 250,
            useNativeDriver: true
          }).start();
        });
      }, 50); // slight delay to ensure layout is stable
    }
  };

  const hideKeypad = () => {
    setIsVisible(false);
    setActiveInputId(null);
    currentShift.current = 0;
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
      if (key === '.' && newValue.includes('.')) return;
      if (maxLength && newValue.length >= maxLength) return;
      newValue = newValue + key;
    }

    setValue(newValue);
    onChangeCallback(newValue);
  };

  return (
    <KeypadContext.Provider value={{ showKeypad, hideKeypad, isKeypadVisible: isVisible, activeInputId, appTranslateY }}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: appTranslateY }] }}>
        {children}
      </Animated.View>
      <CustomKeypad 
        isVisible={isVisible} 
        onKeyPress={handleKeyPress} 
        onClose={hideKeypad} 
        allowDecimal={allowDecimal}
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
