import { BudgetService } from '../BudgetService';
import { getDb } from '../../database/db';
import { CategoryService } from '../CategoryService';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('../CategoryService', () => ({
  CategoryService: {
    getCategories: jest.fn(),
  },
}));

jest.mock('react-native-uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('BudgetService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('seedDefaultBudgets', () => {
    it('should not seed if budgets already exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 1 });
      await BudgetService.seedDefaultBudgets();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM budgets');
      expect(CategoryService.getCategories).not.toHaveBeenCalled();
    });

    it('should not seed if no expense categories exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      (CategoryService.getCategories as jest.Mock).mockResolvedValue([{ id: '1', name: 'Income', type: 'income' }]);
      await BudgetService.seedDefaultBudgets();
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should seed default budgets for existing expense categories', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      (CategoryService.getCategories as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Food & Drinks', type: 'expense' },
        { id: 'cat-2', name: 'Coffee', type: 'expense' },
        { id: 'cat-3', name: 'Random', type: 'expense' }
      ]);
      
      const addBudgetSpy = jest.spyOn(BudgetService, 'addBudget').mockResolvedValue(undefined);

      await BudgetService.seedDefaultBudgets();
      
      expect(addBudgetSpy).toHaveBeenCalledTimes(2);
      expect(addBudgetSpy).toHaveBeenCalledWith(expect.objectContaining({
        categoryId: 'cat-1',
        amount: 3000000,
      }));
      expect(addBudgetSpy).toHaveBeenCalledWith(expect.objectContaining({
        categoryId: 'cat-2',
        amount: 400000,
      }));

      addBudgetSpy.mockRestore();
    });
  });

  describe('getBudgets', () => {
    it('should return budgets for a specific month and year', async () => {
      const mockBudgets = [{ id: '1', amount: 100 }];
      mockDb.getAllAsync.mockResolvedValue(mockBudgets);

      const result = await BudgetService.getBudgets(6, 2023);
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM budgets WHERE month = ? AND year = ?', 6, 2023);
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('getBudgetById', () => {
    it('should return a budget if found', async () => {
      const mockBudget = { id: '1', amount: 100 };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);

      const result = await BudgetService.getBudgetById('1');
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM budgets WHERE id = ?', '1');
      expect(result).toEqual(mockBudget);
    });

    it('should return null if not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await BudgetService.getBudgetById('2');
      
      expect(result).toBeNull();
    });
  });

  describe('addBudget', () => {
    it('should insert a new budget', async () => {
      const budget: any = {
        id: '1', categoryId: 'c1', amount: 100, month: 6, year: 2023, createdAt: '2023', updatedAt: '2023'
      };

      await BudgetService.addBudget(budget);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO budgets'),
        '1', 'c1', 100, 6, 2023, '2023', '2023'
      );
    });
  });

  describe('updateBudget', () => {
    it('should update an existing budget', async () => {
      const budget: any = {
        id: '1', categoryId: 'c1', amount: 200, month: 6, year: 2023, updatedAt: '2023'
      };

      await BudgetService.updateBudget(budget);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE budgets SET'),
        'c1', 200, 6, 2023, '2023', '1'
      );
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget', async () => {
      await BudgetService.deleteBudget('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM budgets WHERE id = ?', '1');
    });
  });
});
