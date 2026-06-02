import os
import re

files_to_check = [
    "src/screens/AddEditBudgetScreen.tsx",
    "src/screens/AddEditRecurringTransactionScreen.tsx",
    "src/screens/AddEditSavingsGoalScreen.tsx",
    "src/screens/AddEditTemplateScreen.tsx",
    "src/screens/AddEditWalletScreen.tsx",
    "src/screens/AddTransactionScreen.tsx",
    "src/screens/OnboardingScreen.tsx",
    "src/screens/PendingRecurringScreen.tsx",
    "src/screens/SavingsGoalDetailScreen.tsx"
]

for filepath in files_to_check:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Add import if not present
    if "AmountInput" not in content:
        import_stmt = "import { AmountInput } from '../components/glass/AmountInput';\n"
        # Find last import
        import_match = list(re.finditer(r'^import .*?;$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            content = content[:last_import.end()] + '\n' + import_stmt + content[last_import.end():]
        else:
            content = import_stmt + content

    # Replace <TextInput ... keyboardType="numeric" ... /> or >...</TextInput>
    # This regex is a bit complex. Let's do a simple replace of <TextInput with <AmountInput
    # only for the ones that have keyboardType="numeric".
    
    # We will search for <TextInput ... keyboardType="numeric" ... />
    # We can use a regex that matches <TextInput up to /> or </TextInput>
    pattern = re.compile(r'<TextInput([^>]*?)keyboardType="numeric"([^>]*?)/>', re.DOTALL)
    
    def replacer(match):
        attrs = match.group(1) + match.group(2)
        return f'<AmountInput{attrs}/>'

    content = pattern.sub(replacer, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

