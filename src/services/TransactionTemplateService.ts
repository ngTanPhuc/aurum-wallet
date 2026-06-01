import { getDb } from '../database/db';
import { TransactionTemplate } from '../types';
import uuid from 'react-native-uuid';

export class TransactionTemplateService {
  static async getTemplates(): Promise<TransactionTemplate[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<TransactionTemplate>('SELECT * FROM transaction_templates ORDER BY createdAt DESC;');
    return rows;
  }

  static async addTemplate(template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionTemplate> {
    const db = await getDb();
    const id = uuid.v4() as string;
    const now = new Date().toISOString();

    const newTemplate: TransactionTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO transaction_templates (id, name, type, amount, fee, walletId, categoryId, note, icon, color, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTemplate.id,
        newTemplate.name,
        newTemplate.type,
        newTemplate.amount,
        newTemplate.fee || 0,
        newTemplate.walletId,
        newTemplate.categoryId || null,
        newTemplate.note || '',
        newTemplate.icon || null,
        newTemplate.color || null,
        newTemplate.createdAt,
        newTemplate.updatedAt,
      ]
    );

    return newTemplate;
  }

  static async updateTemplate(template: TransactionTemplate): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE transaction_templates 
       SET name = ?, type = ?, amount = ?, fee = ?, walletId = ?, categoryId = ?, note = ?, icon = ?, color = ?, updatedAt = ?
       WHERE id = ?`,
      [
        template.name,
        template.type,
        template.amount,
        template.fee || 0,
        template.walletId,
        template.categoryId || null,
        template.note || '',
        template.icon || null,
        template.color || null,
        now,
        template.id,
      ]
    );
  }

  static async deleteTemplate(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM transaction_templates WHERE id = ?', [id]);
  }
}
