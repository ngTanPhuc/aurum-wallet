import { getDb } from '../database/db';
import { Category } from '../types';
import uuid from 'react-native-uuid';

export const CategoryService = {
  async seedDefaultCategories(): Promise<void> {
    const db = await getDb();
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if (countResult && countResult.count > 0) {
      await this.ensureDebtCategoriesExist();
      return;
    }

    const defaultExpenses = [
      { name: 'Food & Drinks', icon: 'fast-food' },
      { name: 'Coffee', icon: 'cafe' },
      { name: 'Groceries', icon: 'cart' },
      { name: 'Transport', icon: 'bus' },
      { name: 'Shopping', icon: 'bag' },
      { name: 'Entertainment', icon: 'film' },
      { name: 'Education', icon: 'book' },
      { name: 'Health', icon: 'medkit' },
      { name: 'Rent', icon: 'home' },
      { name: 'Utilities', icon: 'flash' },
      { name: 'Phone & Internet', icon: 'phone-portrait' },
      { name: 'Travel', icon: 'airplane' },
      { name: 'Gifts', icon: 'gift' },
      { name: 'Subscriptions', icon: 'repeat' },
      { name: 'Other', icon: 'cube' },
      { name: 'Lending', icon: 'push-outline' },
      { name: 'Debt Payment', icon: 'cash-outline' },
    ];

    const defaultIncome = [
      { name: 'Salary', icon: 'wallet' },
      { name: 'Freelance', icon: 'laptop' },
      { name: 'Allowance', icon: 'cash' },
      { name: 'Gift', icon: 'gift' },
      { name: 'Interest', icon: 'trending-up' },
      { name: 'Refund', icon: 'arrow-undo' },
      { name: 'Other', icon: 'cube' },
      { name: 'Borrowed Money', icon: 'download-outline' },
      { name: 'Debt Repayment', icon: 'wallet-outline' },
    ];

    for (const exp of defaultExpenses) {
      await this.addCategory({
        id: uuid.v4() as string,
        name: exp.name,
        type: 'expense',
        icon: exp.icon,
        isDefault: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    for (const inc of defaultIncome) {
      await this.addCategory({
        id: uuid.v4() as string,
        name: inc.name,
        type: 'income',
        icon: inc.icon,
        isDefault: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async getCategories(): Promise<Category[]> {
    const db = await getDb();
    return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', id);
    return result || null;
  },

  async addCategory(category: Category): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO categories (id, name, type, icon, color, isDefault, isArchived, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      category.id,
      category.name,
      category.type,
      category.icon || '',
      category.color || '',
      category.isDefault ? 1 : 0,
      category.isArchived ? 1 : 0,
      category.createdAt,
      category.updatedAt
    );
  },

  async updateCategory(category: Category): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE categories SET 
        name = ?, type = ?, icon = ?, color = ?, isDefault = ?, isArchived = ?, updatedAt = ?
       WHERE id = ?`,
      category.name,
      category.type,
      category.icon || '',
      category.color || '',
      category.isDefault ? 1 : 0,
      category.isArchived ? 1 : 0,
      category.updatedAt,
      category.id
    );
  },

  async deleteCategory(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  },

  async ensureDebtCategoriesExist(): Promise<void> {
    const db = await getDb();
    const debtCategories = [
      { name: 'Lending', type: 'expense', icon: 'push-outline' },
      { name: 'Debt Payment', type: 'expense', icon: 'cash-outline' },
      { name: 'Borrowed Money', type: 'income', icon: 'download-outline' },
      { name: 'Debt Repayment', type: 'income', icon: 'wallet-outline' },
    ] as const;

    for (const cat of debtCategories) {
      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM categories WHERE name = ? AND type = ?', [cat.name, cat.type]);
      if (!existing) {
        await this.addCategory({
          id: uuid.v4() as string,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          isDefault: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
};
