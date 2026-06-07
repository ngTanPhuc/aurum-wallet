import { getDb } from '../database/db';
import { Budget } from '../types';

import uuid from 'react-native-uuid';
import { CategoryService } from './CategoryService';

export const BudgetService = {


  async getBudgets(month: number, year: number): Promise<Budget[]> {
    const db = await getDb();
    return await db.getAllAsync<Budget>(
      'SELECT * FROM budgets WHERE month = ? AND year = ?',
      month, 
      year
    );
  },

  async getBudgetById(id: string): Promise<Budget | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<Budget>('SELECT * FROM budgets WHERE id = ?', id);
    return result || null;
  },

  async addBudget(budget: Budget): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO budgets (id, categoryId, amount, month, year, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      budget.id,
      budget.categoryId,
      budget.amount,
      budget.month,
      budget.year,
      budget.createdAt,
      budget.updatedAt
    );
  },

  async updateBudget(budget: Budget): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE budgets SET 
        categoryId = ?, amount = ?, month = ?, year = ?, updatedAt = ?
       WHERE id = ?`,
      budget.categoryId,
      budget.amount,
      budget.month,
      budget.year,
      budget.updatedAt,
      budget.id
    );
  },

  async deleteBudget(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
  }
};
