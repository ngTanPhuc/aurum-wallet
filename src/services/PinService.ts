import { Platform } from 'react-native';

const PIN_KEY = 'app_pin_hash';

/**
 * Platform-adaptive secure storage.
 * - Native: uses expo-secure-store (hardware-backed Keychain/Keystore)
 * - Web: falls back to AsyncStorage (since SecureStore requires native APIs)
 */
const storage = Platform.OS === 'web'
  ? {
      async getItemAsync(key: string): Promise<string | null> {
        return localStorage.getItem(key);
      },
      async setItemAsync(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
      },
      async deleteItemAsync(key: string): Promise<void> {
        localStorage.removeItem(key);
      },
    }
  : require('expo-secure-store');

export const PinService = {
  async setPin(pin: string): Promise<void> {
    await storage.setItemAsync(PIN_KEY, pin);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const stored = await storage.getItemAsync(PIN_KEY);
    return stored === pin;
  },

  async hasPin(): Promise<boolean> {
    const stored = await storage.getItemAsync(PIN_KEY);
    return stored !== null;
  },

  async removePin(): Promise<void> {
    await storage.deleteItemAsync(PIN_KEY);
  },
};