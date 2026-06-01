import { useSettingsStore } from '../useSettingsStore';
import { SettingsService } from '../../services/SettingsService';

jest.mock('../../services/SettingsService', () => ({
  SettingsService: {
    isFirstRun: jest.fn().mockResolvedValue(false),
    getDefaultCurrency: jest.fn().mockResolvedValue('USD'),
    setDefaultCurrency: jest.fn(),
    setFirstRunCompleted: jest.fn(),
    wipeAllData: jest.fn(),
  }
}));

jest.mock('../useFinanceStore', () => ({
  useFinanceStore: {
    getState: () => ({
      loadData: jest.fn(),
    })
  }
}));

jest.mock('../../services/CategoryService', () => ({
  CategoryService: {
    seedDefaultCategories: jest.fn(),
  }
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads settings', async () => {
    const store = useSettingsStore.getState();
    await store.loadSettings();
    expect(useSettingsStore.getState().settings.defaultCurrency).toBe('USD');
    expect(useSettingsStore.getState().settings.isFirstRun).toBe(false);
  });

  it('updates currency', async () => {
    const store = useSettingsStore.getState();
    await store.updateCurrency('EUR');
    expect(SettingsService.setDefaultCurrency).toHaveBeenCalledWith('EUR');
    expect(useSettingsStore.getState().settings.defaultCurrency).toBe('EUR');
  });

  it('completes first run', async () => {
    const store = useSettingsStore.getState();
    await store.completeFirstRun();
    expect(SettingsService.setFirstRunCompleted).toHaveBeenCalled();
    expect(useSettingsStore.getState().settings.isFirstRun).toBe(false);
  });

  it('wipes data', async () => {
    const store = useSettingsStore.getState();
    await store.wipeData();
    expect(SettingsService.wipeAllData).toHaveBeenCalled();
    expect(useSettingsStore.getState().settings.isFirstRun).toBe(true);
  });
});
