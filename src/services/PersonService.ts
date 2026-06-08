import { getDb } from '../database/db';
import { Person } from '../types';

export const PersonService = {
  async getPeople(): Promise<Person[]> {
    const db = await getDb();
    return await db.getAllAsync<Person>('SELECT * FROM people ORDER BY name ASC');
  },

  async getPersonById(id: string): Promise<Person | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<Person>('SELECT * FROM people WHERE id = ?', id);
    return result || null;
  },

  async addPerson(person: Person): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO people (id, name, phone, email, note, avatarColor, isArchived, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      person.id,
      person.name,
      person.phone || null,
      person.email || null,
      person.note || null,
      person.avatarColor || null,
      person.isArchived ? 1 : 0,
      person.createdAt,
      person.updatedAt
    );
  },

  async updatePerson(person: Person): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE people SET 
        name = ?, phone = ?, email = ?, note = ?, avatarColor = ?, isArchived = ?, updatedAt = ?
       WHERE id = ?`,
      person.name,
      person.phone || null,
      person.email || null,
      person.note || null,
      person.avatarColor || null,
      person.isArchived ? 1 : 0,
      person.updatedAt,
      person.id
    );
  },

  async deletePerson(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM people WHERE id = ?', id);
  }
};
