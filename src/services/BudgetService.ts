import { getDb } from '../database/db';
import { Budget } from '../types';

import uuid from 'react-native-uuid';
import { CategoryService } from './CategoryService';

export const BudgetService = {
  async seedDefaultBudgets(): Promise<void> {
    const db = await getDb();
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM budgets');
    if (countResult && countResult.count > 0) return;

    const categories = await CategoryService.getCategories();
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    if (expenseCategories.length === 0) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Map some reasonable budget amounts to common categories
    const defaultBudgets = [
      { name: 'Food & Drinks', amount: 3000000 }, // e.g. 3M VND
      { name: 'Groceries', amount: 2000000 },
      { name: 'Transport', amount: 500000 },
      { name: 'Shopping', amount: 1500000 },
      { name: 'Coffee', amount: 400000 },
    ];

    for (const def of defaultBudgets) {
      const cat = expenseCategories.find(c => c.name === def.name);
      if (cat) {
        await this.addBudget({
          id: uuid.v4() as string,
          categoryId: cat.id,
          amount: def.amount,
          month,
          year,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  },

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
