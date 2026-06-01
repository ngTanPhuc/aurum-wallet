import re

def fix(path):
    with open(path) as f:
        c = f.read()
    orig = c
    
    # WalletService.test.ts duplicates
    c = re.sub(r'includeInTotal: \w+, isArchived: \w+,\s*includeInTotal: \w+, isArchived: \w+,', 'includeInTotal: false, isArchived: true,', c)
    c = re.sub(r'initialBalance: 0, includeInTotal: true, isArchived: false,  color: \'#000\', icon: \'💰\', includeInTotal: true, isArchived: false,', "initialBalance: 0, color: '#000', icon: '💰', includeInTotal: true, isArchived: false,", c)
    c = re.sub(r'initialBalance: 0, includeInTotal: true, isArchived: false,  includeInTotal: false, isArchived: true,', 'initialBalance: 0, includeInTotal: false, isArchived: true,', c)

    # Missing properties in WalletsScreen.test.tsx
    if 'WalletsScreen.test.tsx' in path or 'WalletPicker.test.tsx' in path or 'WalletCard.test.tsx' in path:
        c = c.replace("isArchived: false, name: 'Main' }", "isArchived: false, name: 'Main', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' }")
        c = c.replace("isArchived: true, name: 'Old' }", "isArchived: true, name: 'Old', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' }")
        c = c.replace("isArchived: false, name: 'Savings' }", "isArchived: false, name: 'Savings', type: 'cash', balance: 100, initialBalance: 0, includeInTotal: true, currency: 'USD', createdAt: '', updatedAt: '' }")
        c = c.replace("mockWallet: Wallet = { id: 'w1', name: 'Bank', type: 'cash', balance: 5000, currency: 'USD', initialBalance: 0, includeInTotal: True, isArchived: False,  isArchived: false, isDefault: false, createdAt: '', updatedAt: '' }", "mockWallet: Wallet = { id: 'w1', name: 'Bank', type: 'cash', balance: 5000, currency: 'USD', initialBalance: 0, includeInTotal: true, isArchived: false, createdAt: '', updatedAt: '' }")
        c = c.replace("includeInTotal: True, isArchived: False,", "includeInTotal: true, isArchived: false,")
        c = c.replace("isArchived: false, isDefault: false,", "isArchived: false,")

    # TransactionTemplate missing properties
    if 'TransactionTemplateService.test.ts' in path:
        c = c.replace("walletId: 'w1' }", "walletId: 'w1', note: '' }")
        c = c.replace("note: 'New note',", "") # remove duplicate

    # InsightEngine.test.ts Category missing properties
    if 'InsightEngine.test.ts' in path:
        c = c.replace("type: 'expense', createdAt: '', updatedAt: '',", "type: 'expense', isDefault: false, isArchived: false, createdAt: '', updatedAt: '',")

    # TransactionService.test.ts missing note
    if 'TransactionService.test.ts' in path:
        c = c.replace("const tx: Transaction = {", "const tx: Transaction = { note: '', ")

    # BudgetProgressCard.test.tsx missing createdAt, updatedAt
    if 'BudgetProgressCard.test.tsx' in path:
        c = c.replace("year: 2023 }", "year: 2023, createdAt: '', updatedAt: '' }")

    # InsightCard.test.tsx missing priority
    if 'InsightCard.test.tsx' in path:
        c = c.replace("description: 'Test insight' }", "description: 'Test insight', priority: 1 }")

    # TransactionItem.test.tsx missing note
    if 'TransactionItem.test.tsx' in path:
        c = c.replace("updatedAt: '2023-01-01T00:00:00.000Z' }", "updatedAt: '2023-01-01T00:00:00.000Z', note: '' }")

    if c != orig:
        with open(path, 'w') as f:
            f.write(c)

import glob
for f in glob.glob('src/**/*.ts*', recursive=True):
    if '__tests__' in f:
        fix(f)
