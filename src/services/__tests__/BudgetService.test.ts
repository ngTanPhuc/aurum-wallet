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


  describe('getBudgets', () => {
    it('should return budgets for a specific month and year', async () => {
      const mockBudgets = [{ id: '1', amount: 100 }];
      mockDb.getAllAsync.mockResolvedValue(mockBudgets);

      const result = await BudgetService.getBudgets();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM budgets');
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
