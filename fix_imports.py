import os

files = [
    "src/components/CategoryPicker.tsx",
    "src/components/CustomHeader.tsx",
    "src/components/FilterModal.tsx",
    "src/components/GlobalFAB.tsx",
    "src/components/MetricCard.tsx",
    "src/components/SavingsGoalCard.tsx",
    "src/components/TagPicker.tsx",
    "src/components/TransactionItem.tsx",
    "src/components/WalletPicker.tsx",
    "src/screens/TransactionsScreen.tsx"
]

for p in files:
    if os.path.exists(p):
        with open(p, "r") as f:
            lines = f.readlines()
        
        if len(lines) >= 2:
            if lines[0].strip() == "import React":
                # Line 2 looks like: import { Ionicons } from '@expo/vector-icons';, { useState } from 'react';
                line2 = lines[1]
                # Extract the rest of the react import
                rest = line2.replace("import { Ionicons } from '@expo/vector-icons';", "").strip()
                lines[0] = f"import React{rest}\n"
                lines[1] = "import { Ionicons } from '@expo/vector-icons';\n"
        
        with open(p, "w") as f:
            f.writelines(lines)

print("Imports fixed.")
