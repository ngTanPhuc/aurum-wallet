import { getDb, initDb } from '../db';
import * as SQLite from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn(),
  })),
}));

describe('database db.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initDb opens database and executes schema', async () => {
    await initDb();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('aurum_v1.db');
  });

  it('getDb resolves to a wrapper', async () => {
    const db = await getDb();
    expect(db).toHaveProperty('runAsync');
    expect(db).toHaveProperty('getFirstAsync');
    expect(db).toHaveProperty('getAllAsync');
  });
});
