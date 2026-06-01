import re

files = [
    "src/components/__tests__/BudgetProgressCard.test.tsx",
    "src/components/__tests__/InsightCard.test.tsx",
    "src/components/__tests__/TransactionItem.test.tsx",
    "src/components/__tests__/WalletCard.test.tsx",
    "src/components/__tests__/WalletPicker.test.tsx",
    "src/screens/__tests__/WalletsScreen.test.tsx",
    "src/services/__tests__/TransactionService.test.ts",
    "src/services/__tests__/TransactionTemplateService.test.ts",
    "src/services/__tests__/WalletService.test.ts"
]

import os
for path in files:
    if not os.path.exists(path): continue
    with open(path) as f:
        c = f.read()
    
    # fix BudgetProgressCard
    if "BudgetProgressCard" in path:
        c = c.replace("year: 2023 }", "year: 2023, createdAt: '', updatedAt: '' }")
    
    # fix InsightCard
    if "InsightCard" in path:
        c = c.replace("description: 'Test' }", "description: 'Test', priority: 1 }")
        
    # fix TransactionItem
    if "TransactionItem" in path:
        c = c.replace("updatedAt: '' }", "updatedAt: '', note: '' }")
        
    # fix WalletCard
    if "WalletCard" in path:
        c = c.replace("updatedAt: '' }", "updatedAt: '', initialBalance: 0, includeInTotal: true, isArchived: false }")
        
    # fix WalletPicker
    if "WalletPicker" in path:
        c = c.replace("isArchived: false,  isArchived: false", "isArchived: false")
        
    # fix WalletsScreen
    if "WalletsScreen" in path:
        # The WalletsScreen mock has type error because it's passed to mock state but it lacks something or has wrong type
        pass 
        
    # fix TransactionService
    if "TransactionService" in path:
        c = re.sub(r"note: 'note',\s*note: 'note',", "note: 'note',", c)
        
    # fix TransactionTemplateService
    if "TransactionTemplateService" in path:
        c = c.replace("walletId: 'w1' }", "walletId: 'w1', note: '' }")
        
    # fix WalletService
    if "WalletService" in path:
        c = c.replace("initialBalance: 0, color: '#000', icon: '💰', includeInTotal: true, isArchived: false,  initialBalance: 0, includeInTotal: true, isArchived: false", "initialBalance: 0, color: '#000', icon: '💰', includeInTotal: true, isArchived: false")
        c = c.replace("initialBalance: 0, includeInTotal: false, isArchived: true,  initialBalance: 0, includeInTotal: true, isArchived: false", "initialBalance: 0, includeInTotal: false, isArchived: true")

    with open(path, 'w') as f:
        f.write(c)
