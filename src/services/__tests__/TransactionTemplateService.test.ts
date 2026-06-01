import { TransactionTemplateService } from '../TransactionTemplateService';
import { getDb } from '../../database/db';
import uuid from 'react-native-uuid';
import { TransactionTemplate } from '../../types';

jest.mock('../../database/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(),
}));

describe('TransactionTemplateService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    (uuid.v4 as jest.Mock).mockReturnValue('test-uuid');
    jest.clearAllMocks();
  });

  it('getTemplates should return templates from db', async () => {
    const mockTemplates: TransactionTemplate[] = [
      { id: '1', name: 'T1', type: 'expense', amount: 100, walletId: 'w1', note: '', createdAt: 'date', updatedAt: 'date' },
    ];
    mockDb.getAllAsync.mockResolvedValue(mockTemplates);

    const result = await TransactionTemplateService.getTemplates();
    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM transaction_templates ORDER BY createdAt DESC;');
    expect(result).toEqual(mockTemplates);
  });

  it('addTemplate should insert and return new template', async () => {
    const templateData = {
      name: 'T2',
      type: 'income' as const,
      amount: 200,
      walletId: 'w2',
    };

    const before = new Date().toISOString();
    const result = await TransactionTemplateService.addTemplate(templateData);
    const after = new Date().toISOString();

    expect(result.id).toBe('test-uuid');
    expect(result.name).toBe('T2');
    expect(result.type).toBe('income');
    expect(result.amount).toBe(200);
    expect(result.walletId).toBe('w2');
    expect(result.createdAt >= before && result.createdAt <= after).toBe(true);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      [
        'test-uuid',
        'T2',
        'income',
        200,
        'w2',
        null,
        '',
        null,
        null,
        result.createdAt,
        result.createdAt,
      ]
    );
  });

  it('addTemplate should handle optional fields', async () => {
    const templateData = {
      name: 'T3',
      type: 'transfer' as const,
      amount: 300,
      walletId: 'w3',
      categoryId: 'c1',
      note: 'Note',
      icon: 'icon',
      color: 'color',
    };

    const result = await TransactionTemplateService.addTemplate(templateData);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      [
        'test-uuid',
        'T3',
        'transfer',
        300,
        'w3',
        'c1',
        'Note',
        'icon',
        'color',
        result.createdAt,
        result.createdAt,
      ]
    );
  });

  it('updateTemplate should update template in db', async () => {
    const template: TransactionTemplate = {
      id: '1',
      name: 'T1',
      type: 'expense',
      amount: 150,
      walletId: 'w1', note: '',
      categoryId: 'c2',
      
      icon: 'icon2',
      color: 'color2',
      createdAt: 'old',
      updatedAt: 'old',
    };

    await TransactionTemplateService.updateTemplate(template);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      [
        'T1',
        'expense',
        150,
        'w1',
        'c2',
        'New note',
        'icon2',
        'color2',
        expect.any(String), // updatedAt
        '1',
      ]
    );
  });

  it('updateTemplate should handle missing optional fields', async () => {
    const template: TransactionTemplate = {
      id: '1',
      name: 'T1',
      type: 'expense',
      amount: 150,
      walletId: 'w1', note: '',
      createdAt: 'old',
      updatedAt: 'old',
    };

    await TransactionTemplateService.updateTemplate(template);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      [
        'T1',
        'expense',
        150,
        'w1',
        null,
        '',
        null,
        null,
        expect.any(String), // updatedAt
        '1',
      ]
    );
  });

  it('deleteTemplate should remove template from db', async () => {
    await TransactionTemplateService.deleteTemplate('1');
    expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM transaction_templates WHERE id = ?', ['1']);
  });
});
