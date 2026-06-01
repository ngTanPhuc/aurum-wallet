import { CategoryService } from '../CategoryService';
import { getDb } from '../../database/db';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('CategoryService', () => {
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

  describe('seedDefaultCategories', () => {
    it('should not seed if categories already exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 1 });
      await CategoryService.seedDefaultCategories();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM categories');
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should seed default categories if none exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });
      
      const addCategorySpy = jest.spyOn(CategoryService, 'addCategory').mockResolvedValue(undefined);

      await CategoryService.seedDefaultCategories();
      
      expect(addCategorySpy).toHaveBeenCalled();
      // Should add both default expenses and income (15 + 7 = 22)
      expect(addCategorySpy).toHaveBeenCalledTimes(22);

      addCategorySpy.mockRestore();
    });
  });

  describe('getCategories', () => {
    it('should return all categories ordered by name', async () => {
      const mockCategories = [{ id: '1', name: 'Food' }];
      mockDb.getAllAsync.mockResolvedValue(mockCategories);

      const result = await CategoryService.getCategories();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM categories ORDER BY name ASC');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getCategoryById', () => {
    it('should return a category if found', async () => {
      const mockCategory = { id: '1', name: 'Food' };
      mockDb.getFirstAsync.mockResolvedValue(mockCategory);

      const result = await CategoryService.getCategoryById('1');
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM categories WHERE id = ?', '1');
      expect(result).toEqual(mockCategory);
    });

    it('should return null if not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await CategoryService.getCategoryById('2');
      
      expect(result).toBeNull();
    });
  });

  describe('addCategory', () => {
    it('should insert a new category', async () => {
      const category: any = {
        id: '1', name: 'Food', type: 'expense', icon: '🍔', color: '#ff0000',
        isDefault: true, isArchived: false, createdAt: '2023', updatedAt: '2023'
      };

      await CategoryService.addCategory(category);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        '1', 'Food', 'expense', '🍔', '#ff0000', 1, 0, '2023', '2023'
      );
    });
    
    it('should handle optional icon and color', async () => {
      const category: any = {
        id: '1', name: 'Food', type: 'expense',
        isDefault: false, isArchived: true, createdAt: '2023', updatedAt: '2023'
      };

      await CategoryService.addCategory(category);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        '1', 'Food', 'expense', '', '', 0, 1, '2023', '2023'
      );
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const category: any = {
        id: '1', name: 'Food', type: 'expense', icon: '🍔', color: '#ff0000',
        isDefault: true, isArchived: false, updatedAt: '2023'
      };

      await CategoryService.updateCategory(category);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET'),
        'Food', 'expense', '🍔', '#ff0000', 1, 0, '2023', '1'
      );
    });
    
    it('should handle optional icon and color on update', async () => {
      const category: any = {
        id: '1', name: 'Food', type: 'expense',
        isDefault: false, isArchived: true, updatedAt: '2023'
      };

      await CategoryService.updateCategory(category);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET'),
        'Food', 'expense', '', '', 0, 1, '2023', '1'
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      await CategoryService.deleteCategory('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM categories WHERE id = ?', '1');
    });
  });
});
