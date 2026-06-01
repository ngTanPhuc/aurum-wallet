import os

def add_import(content):
    if "import { Ionicons } from '@expo/vector-icons';" not in content:
        content = content.replace("import React", "import React\nimport { Ionicons } from '@expo/vector-icons';")
    return content

# GlobalFAB
p = "src/components/GlobalFAB.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={styles.actionIcon}>💰</Text>", '<Ionicons name="flag" size={20} color={theme.colors.background} />')
    c = c.replace("<Text style={styles.actionIcon}>🎯</Text>", '<Ionicons name="pie-chart" size={20} color={theme.colors.background} />')
    c = c.replace("<Text style={styles.actionIcon}>🔁</Text>", '<Ionicons name="repeat" size={20} color={theme.colors.background} />')
    c = c.replace("<Text style={styles.actionIcon}>💳</Text>", '<Ionicons name="wallet" size={20} color={theme.colors.background} />')
    c = c.replace("<Text style={styles.actionIcon}>📝</Text>", '<Ionicons name="add" size={20} color={theme.colors.background} />')
    c = c.replace("<Text style={[styles.fabIcon, isOpen && styles.fabIconOpen]}>{isOpen ? '×' : '+'}</Text>", '<Ionicons name={isOpen ? "close" : "add"} size={32} color={theme.colors.background} />')
    with open(p, "w") as f: f.write(c)

# TransactionItem
p = "src/components/TransactionItem.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("if (isTransfer) return '⇄';", "if (isTransfer) return 'swap-horizontal';")
    c = c.replace("return category?.icon || (isExpense ? '💸' : '💰');", "return category?.icon || (isExpense ? 'cash-outline' : 'wallet-outline');")
    c = c.replace("<Text style={styles.icon}>{getIcon()}</Text>", '<Ionicons name={getIcon() as any} size={24} color={theme.colors.text} style={{marginRight: 12}} />')
    with open(p, "w") as f: f.write(c)

print("Done phase 2")
