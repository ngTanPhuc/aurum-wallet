import { SavingsGoal } from '../types';
import { getDb } from '../database/db';

export const SavingsGoalService = {
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const db = await getDb();
    return await db.getAllAsync<SavingsGoal>(
      'SELECT * FROM savings_goals ORDER BY createdAt DESC'
    );
  },

  async getSavingsGoalById(id: string): Promise<SavingsGoal | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<SavingsGoal>(
      'SELECT * FROM savings_goals WHERE id = ?',
      id
    );
    return result || null;
  },

  async addSavingsGoal(goal: SavingsGoal): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, linkedWalletId, color, icon, isCompleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      goal.id,
      goal.name,
      goal.targetAmount,
      goal.currentAmount,
      goal.targetDate || null,
      goal.linkedWalletId || null,
      goal.color || null,
      goal.icon || null,
      goal.isCompleted ? 1 : 0,
      goal.createdAt,
      goal.updatedAt
    );
  },

  async updateSavingsGoal(goal: SavingsGoal): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE savings_goals SET 
        name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?, linkedWalletId = ?, 
        color = ?, icon = ?, isCompleted = ?, updatedAt = ?
       WHERE id = ?`,
      goal.name,
      goal.targetAmount,
      goal.currentAmount,
      goal.targetDate || null,
      goal.linkedWalletId || null,
      goal.color || null,
      goal.icon || null,
      goal.isCompleted ? 1 : 0,
      goal.updatedAt,
      goal.id
    );
  },

  async updateSavingsGoalAmount(id: string, amountChange: number): Promise<void> {
    const db = await getDb();
    const goal = await this.getSavingsGoalById(id);
    if (!goal) return;
    
    let newAmount = goal.currentAmount + amountChange;
    if (newAmount < 0) newAmount = 0;
    const isCompleted = newAmount >= goal.targetAmount;
    
    await db.runAsync(
      'UPDATE savings_goals SET currentAmount = ?, isCompleted = ?, updatedAt = ? WHERE id = ?',
      newAmount,
      isCompleted ? 1 : 0,
      new Date().toISOString(),
      id
    );
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM savings_goals WHERE id = ?', id);
  }
};
