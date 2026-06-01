import { TagService } from '../TagService';
import { getDb } from '../../database/db';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('TagService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
    
    jest.useFakeTimers().setSystemTime(new Date('2023-06-20T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTags', () => {
    it('should return all tags ordered by name', async () => {
      const mockTags = [{ id: '1', name: 'Work' }];
      mockDb.getAllAsync.mockResolvedValue(mockTags);

      const result = await TagService.getTags();
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM tags ORDER BY name ASC;');
      expect(result).toEqual(mockTags);
    });
  });

  describe('addTag', () => {
    it('should insert and return a new tag', async () => {
      const tagData = { name: 'Work', color: '#ff0000' };

      const result = await TagService.addTag(tagData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
        ['test-uuid', 'Work', '#ff0000', '2023-06-20T12:00:00.000Z']
      );
      
      expect(result).toEqual({
        id: 'test-uuid',
        name: 'Work',
        color: '#ff0000',
        createdAt: '2023-06-20T12:00:00.000Z'
      });
    });

    it('should handle missing color', async () => {
      const tagData = { name: 'Work' };

      const result = await TagService.addTag(tagData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
        ['test-uuid', 'Work', null, '2023-06-20T12:00:00.000Z']
      );
      
      expect(result.color).toBeUndefined();
    });
  });

  describe('updateTag', () => {
    it('should update an existing tag', async () => {
      const tag = { id: '1', name: 'Work', color: '#00ff00', createdAt: '2023' };

      await TagService.updateTag(tag);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE tags SET name = ?, color = ? WHERE id = ?',
        ['Work', '#00ff00', '1']
      );
    });

    it('should handle updating with no color', async () => {
      const tag = { id: '1', name: 'Work', createdAt: '2023' };

      await TagService.updateTag(tag);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE tags SET name = ?, color = ? WHERE id = ?',
        ['Work', null, '1']
      );
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      await TagService.deleteTag('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM tags WHERE id = ?', ['1']);
    });
  });

  describe('setTransactionTags', () => {
    it('should delete existing tags and insert new ones', async () => {
      await TagService.setTransactionTags('tx1', ['tag1', 'tag2']);

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM transaction_tags WHERE transactionId = ?', ['tx1']);
      expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', ['tx1', 'tag1']);
      expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)', ['tx1', 'tag2']);
    });
  });

  describe('getTagsForTransaction', () => {
    it('should return tags for a specific transaction', async () => {
      const mockTags = [{ id: '1', name: 'Work' }];
      mockDb.getAllAsync.mockResolvedValue(mockTags);

      const result = await TagService.getTagsForTransaction('tx1');
      
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.* FROM tags t'),
        ['tx1']
      );
      expect(result).toEqual(mockTags);
    });
  });
});
