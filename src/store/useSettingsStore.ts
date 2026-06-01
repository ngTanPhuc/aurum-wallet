import { create } from 'zustand';
import { AppSettings } from '../types';
import { SettingsService } from '../services/SettingsService';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
  completeFirstRun: () => Promise<void>;
  wipeData: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    defaultCurrency: 'VND',
    pinEnabled: false,
    theme: 'system',
    isFirstRun: true,
  },
  isLoading: true,
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const isFirstRun = await SettingsService.isFirstRun();
      const defaultCurrency = await SettingsService.getDefaultCurrency();
      
      set({
        settings: {
          defaultCurrency,
          pinEnabled: false, // For now, no PIN service
          theme: 'system',
          isFirstRun,
        },
        isLoading: false,
      });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },
  updateCurrency: async (currency: string) => {
    await SettingsService.setDefaultCurrency(currency);
    set((state) => ({
      settings: { ...state.settings, defaultCurrency: currency },
    }));
  },
  completeFirstRun: async () => {
    await SettingsService.setFirstRunCompleted();
    set((state) => ({
      settings: { ...state.settings, isFirstRun: false },
    }));
  },
  wipeData: async () => {
    await SettingsService.wipeAllData();
    const { CategoryService } = require('../services/CategoryService');
    const { useFinanceStore } = require('./useFinanceStore');
    
    await CategoryService.seedDefaultCategories();
    await useFinanceStore.getState().loadData();

    set((state) => ({
      settings: { ...state.settings, isFirstRun: true },
    }));
  },
}));
