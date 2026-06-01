import os
import re

files_to_process = [
    "src/screens/AddTransactionScreen.tsx",
    "src/screens/AddEditBudgetScreen.tsx",
    "src/screens/AddEditSavingsGoalScreen.tsx",
    "src/screens/AddEditWalletScreen.tsx",
    "src/screens/AddEditRecurringTransactionScreen.tsx",
    "src/screens/AddEditTemplateScreen.tsx",
    "src/screens/OnboardingScreen.tsx",
    "src/screens/SavingsGoalDetailScreen.tsx"
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if extraScrollHeight is already added
    if "extraScrollHeight=" not in content:
        content = content.replace(
            '<KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled"',
            '<KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}'
        )
        content = content.replace(
            '<KeyboardAwareScrollView style={styles.container} enableOnAndroid={true} keyboardShouldPersistTaps="handled"',
            '<KeyboardAwareScrollView style={styles.container} enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={20}'
        )

    with open(file_path, 'w') as f:
        f.write(content)

print("Added extraScrollHeight")
