import { getDb } from '../database/db';
import { Tag } from '../types';
import uuid from 'react-native-uuid';

export class TagService {
  static async getTags(): Promise<Tag[]> {
    const db = await getDb();
    return await db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name ASC;');
  }

  static async addTag(tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const db = await getDb();
    const id = uuid.v4() as string;
    const now = new Date().toISOString();

    const newTag: Tag = {
      ...tagData,
      id,
      createdAt: now,
    };

    await db.runAsync(
      'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
      [newTag.id, newTag.name, newTag.color || null, newTag.createdAt]
    );

    return newTag;
  }

  static async updateTag(tag: Tag): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [tag.name, tag.color || null, tag.id]
    );
  }

  static async deleteTag(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
  }

  static async setTransactionTags(transactionId: string, tagIds: string[]): Promise<void> {
    const db = await getDb();
    // Delete existing
    await db.runAsync('DELETE FROM transaction_tags WHERE transactionId = ?', [transactionId]);
    
    // Insert new
    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)',
        [transactionId, tagId]
      );
    }
  }

  static async getTagsForTransaction(transactionId: string): Promise<Tag[]> {
    const db = await getDb();
    return await db.getAllAsync<Tag>(`
      SELECT t.* FROM tags t
      INNER JOIN transaction_tags tt ON t.id = tt.tagId
      WHERE tt.transactionId = ?
    `, [transactionId]);
  }
}
