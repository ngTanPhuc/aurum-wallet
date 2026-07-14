import { SavingsGoalService } from '../SavingsGoalService';
import { getDb } from '../../database/db';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

describe('SavingsGoalService', () => {
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

  describe('getSavingsGoals', () => {
    it('should return all savings goals ordered by createdAt DESC', async () => {
      const mockGoals = [{ id: '1', name: 'Car' }];
      mockDb.getAllAsync.mockResolvedValue(mockGoals);

      const result = await SavingsGoalService.getSavingsGoals();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM savings_goals ORDER BY createdAt DESC');
      expect(result).toEqual(mockGoals);
    });
  });

  describe('getSavingsGoalById', () => {
    it('should return a savings goal if found', async () => {
      const mockGoal = { id: '1', name: 'Car' };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      const result = await SavingsGoalService.getSavingsGoalById('1');
      
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM savings_goals WHERE id = ?', '1');
      expect(result).toEqual(mockGoal);
    });

    it('should return null if not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await SavingsGoalService.getSavingsGoalById('2');
      
      expect(result).toBeNull();
    });
  });

  describe('addSavingsGoal', () => {
    it('should insert a new savings goal', async () => {
      const goal: any = {
        id: '1', name: 'Car', targetAmount: 10000, currentAmount: 1000,
        targetDate: '2024-01-01', linkedWalletId: 'w1', color: '#000', icon: '🚗',
        isCompleted: false, createdAt: '2023', updatedAt: '2023'
      };

      await SavingsGoalService.addSavingsGoal(goal);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO savings_goals'),
        '1', 'Car', 10000, 1000, '2024-01-01', 'w1', '#000', '🚗', 0, '2023', '2023'
      );
    });
    
    it('should insert a new savings goal with null optional fields', async () => {
      const goal: any = {
        id: '1', name: 'Car', targetAmount: 10000, currentAmount: 1000,
        isCompleted: true, createdAt: '2023', updatedAt: '2023'
      };

      await SavingsGoalService.addSavingsGoal(goal);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO savings_goals'),
        '1', 'Car', 10000, 1000, null, null, null, null, 1, '2023', '2023'
      );
    });
  });

  describe('updateSavingsGoal', () => {
    it('should update an existing savings goal', async () => {
      const goal: any = {
        id: '1', name: 'Car', targetAmount: 10000, currentAmount: 1000,
        targetDate: '2024-01-01', linkedWalletId: 'w1', color: '#000', icon: '🚗',
        isCompleted: false, updatedAt: '2023'
      };

      await SavingsGoalService.updateSavingsGoal(goal);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE savings_goals SET'),
        'Car', 10000, 1000, '2024-01-01', 'w1', '#000', '🚗', 0, '2023', '1'
      );
    });

    it('should update an existing savings goal with null optional fields', async () => {
      const goal: any = {
        id: '1', name: 'Car', targetAmount: 10000, currentAmount: 1000,
        isCompleted: true, updatedAt: '2023'
      };

      await SavingsGoalService.updateSavingsGoal(goal);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE savings_goals SET'),
        'Car', 10000, 1000, null, null, null, null, 1, '2023', '1'
      );
    });
  });

  describe('updateSavingsGoalAmount', () => {
    it('should return if goal is not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      await SavingsGoalService.updateSavingsGoalAmount('1', 500);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should update currentAmount and isCompleted when amount increases', async () => {
      const mockGoal = { id: '1', currentAmount: 1000, targetAmount: 2000 };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      await SavingsGoalService.updateSavingsGoalAmount('1', 500);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
        1500, 0, expect.any(String), '1'
      );
    });

    it('should update currentAmount and set isCompleted to true when target is reached', async () => {
      const mockGoal = { id: '1', currentAmount: 1500, targetAmount: 2000 };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      await SavingsGoalService.updateSavingsGoalAmount('1', 500);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
        2000, 1, expect.any(String), '1'
      );
    });
    
    it('should update currentAmount but not drop below zero', async () => {
      const mockGoal = { id: '1', currentAmount: 100, targetAmount: 2000 };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      await SavingsGoalService.updateSavingsGoalAmount('1', -500);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
        0, 0, expect.any(String), '1'
      );
    });
  });

  describe('deleteSavingsGoal', () => {
    it('should delete a savings goal', async () => {
      await SavingsGoalService.deleteSavingsGoal('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM savings_goals WHERE id = ?', '1');
    });
  });

  describe('updateSavingsGoalAmount — edge cases', () => {
    it('should allow currentAmount to exceed targetAmount (overshoot) and mark as completed', async () => {
      const mockGoal = { id: '1', currentAmount: 1900, targetAmount: 2000 };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      // Adding 200 pushes it to 2100, over the 2000 target
      await SavingsGoalService.updateSavingsGoalAmount('1', 200);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
        2100, // NOT clamped to targetAmount — raw amount stored
        1,    // isCompleted = true because 2100 >= 2000
        expect.any(String),
        '1'
      );
    });

    it('should mark goal with targetAmount=0 as immediately completed', async () => {
      // A goal with targetAmount=0: 0 >= 0 is true => isCompleted = true
      const mockGoal = { id: '1', currentAmount: 0, targetAmount: 0 };
      mockDb.getFirstAsync.mockResolvedValue(mockGoal);

      await SavingsGoalService.updateSavingsGoalAmount('1', 0);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
        0,
        1, // isCompleted = true (0 >= 0)
        expect.any(String),
        '1'
      );
    });
  });
});

