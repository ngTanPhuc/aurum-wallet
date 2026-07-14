import { getDb } from '../database/db';
import { Budget } from '../types';

import uuid from 'react-native-uuid';
import { CategoryService } from './CategoryService';

export const BudgetService = {
  async getBudgets(): Promise<Budget[]> {
    const db = await getDb();
    return await db.getAllAsync<Budget>('SELECT * FROM budgets');
  },

  async getBudgetById(id: string): Promise<Budget | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<Budget>('SELECT * FROM budgets WHERE id = ?', id);
    return result || null;
  },

  async addBudget(budget: Budget): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO budgets (id, name, amount, targetType, targetId, recurrence, startDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      budget.id,
      budget.name,
      budget.amount,
      budget.targetType,
      budget.targetId,
      budget.recurrence,
      budget.startDate,
      budget.createdAt,
      budget.updatedAt
    );
  },

  async updateBudget(budget: Budget): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE budgets SET 
        name = ?, amount = ?, targetType = ?, targetId = ?, recurrence = ?, startDate = ?, updatedAt = ?
       WHERE id = ?`,
      budget.name,
      budget.amount,
      budget.targetType,
      budget.targetId,
      budget.recurrence,
      budget.startDate,
      budget.updatedAt,
      budget.id
    );
  },

  async deleteBudget(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
  }
};
