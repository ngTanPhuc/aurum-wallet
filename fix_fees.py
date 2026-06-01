import os

files = [
    "src/screens/AddTransactionScreen.tsx",
    "src/screens/AddEditRecurringTransactionScreen.tsx",
    "src/screens/AddEditTemplateScreen.tsx"
]

def process_file(p):
    with open(p, "r") as f:
        c = f.read()

    # 1. Update the label
    c = c.replace("<Text style={styles.label}>Fee (optional)</Text>", "<Text style={styles.label}>Fee (%) (optional)</Text>")

    # 2. Update initialization (from template or existing)
    # Search for (tx.fee || 0) > 0 ? (tx.fee || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
    # Because we don't know the exact string, we'll replace the line.
    
    # Let's replace the whole assignment to setFee when loading.
    # In AddTransactionScreen: 
    # setFee((template.fee || 0) > 0 ? (template.fee || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
    # and
    # setFee((tx.fee || 0) > 0 ? (tx.fee || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
    
    c = c.replace(
        "setFee((template.fee || 0) > 0 ? (template.fee || 0).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.') : '');",
        "setFee((template.fee && template.amount) ? parseFloat(((template.fee / template.amount) * 100).toFixed(4)).toString() : '');"
    )
    c = c.replace(
        "setFee((tx.fee || 0) > 0 ? (tx.fee || 0).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.') : '');",
        "setFee((tx.fee && tx.amount) ? parseFloat(((tx.fee / tx.amount) * 100).toFixed(4)).toString() : '');"
    )
    
    # In AddEditRecurringTransactionScreen:
    # setFee((rt.fee || 0) > 0 ? (rt.fee || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
    c = c.replace(
        "setFee((rt.fee || 0) > 0 ? (rt.fee || 0).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.') : '');",
        "setFee((rt.fee && rt.amount) ? parseFloat(((rt.fee / rt.amount) * 100).toFixed(4)).toString() : '');"
    )
    
    # 3. Update the handleSave parsing logic
    # Find:
    # const rawFee = fee.replace(/\./g, '');
    # const feeNum = Math.abs(parseFloat(rawFee) || 0);
    # Since we need amtNum, let's see:
    # AddTransactionScreen: 
    # const amtNum = Math.abs(parseFloat(rawValue) || 0);
    # ...
    # const rawFee = fee.replace(/\./g, '');
    # const feeNum = Math.abs(parseFloat(rawFee) || 0);
    
    # Let's use a regex or string replacement.
    old_fee_parse1 = """    const rawFee = fee.replace(/\\./g, '');
    const feeNum = Math.abs(parseFloat(rawFee) || 0);"""
    
    old_fee_parse2 = """    const rawFee = fee.replace(/\\./g, '');
    const feeNum = Math.abs(parseInt(rawFee, 10) || 0);"""
    
    new_fee_parse = """    const feePercentage = Math.abs(parseFloat(fee.replace(/,/g, '.')) || 0);
    const feeNum = amtNum > 0 ? (amtNum * feePercentage) / 100 : 0;"""
    
    # In AddEditRecurringTransactionScreen and AddEditTemplateScreen, amount is parsed into `amountNum`.
    # AddTransactionScreen parses it to `amtNum`.
    # Let's check AddEditRecurringTransactionScreen.
    
    with open(p, "w") as f:
        f.write(c)

for p in files:
    if os.path.exists(p):
        process_file(p)

print("Pre-processed labels and load logic.")
