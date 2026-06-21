import '@testing-library/jest-native/extend-expect';
import React from 'react';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(true),
    runAsync: jest.fn().mockResolvedValue(true),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    withExclusiveTransactionAsync: jest.fn(async (cb) => await cb()),
  }),
}));

// Mock React Navigation
jest.mock('@react-navigation/native-stack', () => {
  const mockComponent = ({ children }) => children || null;
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: mockComponent,
      Screen: mockComponent,
      Group: mockComponent,
    })),
  };
});
jest.mock('@react-navigation/bottom-tabs', () => {
  const mockComponent = ({ children }) => children || null;
  return {
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: mockComponent,
      Screen: mockComponent,
    })),
  };
});

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const mockIcon = ({ name, size, color, style, ...props }) => {
    const { Text } = require('react-native');
    return <Text {...props}>{name}</Text>;
  };
  return {
    Ionicons: mockIcon,
    MaterialCommunityIcons: mockIcon,
    MaterialIcons: mockIcon,
    FontAwesome: mockIcon,
    FontAwesome5: mockIcon,
    Feather: mockIcon,
    Octicons: mockIcon,
  };
});

// Mock react-native-gifted-charts (ESM module that breaks Jest)
jest.mock('react-native-gifted-charts', () => ({
  PieChart: () => null,
  BarChart: () => null,
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => () => null);

// Mock KeypadContext
jest.mock('./src/context/KeypadContext', () => ({
  KeypadProvider: ({ children }) => children,
  useKeypad: () => ({
    showKeypad: jest.fn(),
    hideKeypad: jest.fn(),
    isKeypadVisible: false,
  }),
}));