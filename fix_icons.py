import os

def add_import(content):
    if "import { Ionicons } from '@expo/vector-icons';" not in content:
        content = content.replace("import React", "import React\nimport { Ionicons } from '@expo/vector-icons';")
    return content

# 1. CustomHeader
p = "src/components/CustomHeader.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={styles.backIcon}>←</Text>", '<Ionicons name="chevron-back" size={24} color={theme.colors.text} />')
    with open(p, "w") as f: f.write(c)

# 2. FilterModal
p = "src/components/FilterModal.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={{ fontSize: 24, color: theme.colors.text }}>✕</Text>", '<Ionicons name="close" size={24} color={theme.colors.text} />')
    with open(p, "w") as f: f.write(c)

# 3. TransactionsScreen
p = "src/screens/TransactionsScreen.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={{ fontSize: 20 }}>{hasActiveFilters ? '🟣' : '⚪'}</Text>", '<Ionicons name={hasActiveFilters ? "filter" : "filter-outline"} size={20} color={hasActiveFilters ? theme.colors.primary : theme.colors.text} />')
    with open(p, "w") as f: f.write(c)

# 4. MetricCard
p = "src/components/MetricCard.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("{trend === 'up' && <Text style={[styles.trendIcon, { color: theme.colors.success }]}>▲</Text>}", '{trend === \'up\' && <Ionicons name="trending-up" size={16} color={theme.colors.success} style={{ marginLeft: 4 }} />}')
    c = c.replace("{trend === 'down' && <Text style={[styles.trendIcon, { color: theme.colors.danger }]}>▼</Text>}", '{trend === \'down\' && <Ionicons name="trending-down" size={16} color={theme.colors.danger} style={{ marginLeft: 4 }} />}')
    with open(p, "w") as f: f.write(c)

# 5. CategoryPicker
p = "src/components/CategoryPicker.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("{value === item.id && <Text style={styles.check}>✓</Text>}", '{value === item.id && <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.check} />}')
    # CategoryPicker also displays the item.icon. Needs to use Ionicons instead of Text.
    c = c.replace("<Text style={styles.itemIcon}>{item.icon}</Text>", '<Ionicons name={item.icon as any} size={24} color={theme.colors.text} style={styles.itemIcon} />')
    with open(p, "w") as f: f.write(c)

# 6. WalletPicker
p = "src/components/WalletPicker.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("{value === item.id && <Text style={styles.check}>✓</Text>}", '{value === item.id && <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.check} />}')
    # Wallet icon
    c = c.replace("<Text style={styles.itemIcon}>{item.icon}</Text>", '<Ionicons name={item.icon as any} size={24} color={theme.colors.text} style={styles.itemIcon} />')
    with open(p, "w") as f: f.write(c)

# 7. TagPicker
p = "src/components/TagPicker.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={{ color: theme.colors.background, fontSize: 16, marginLeft: 4 }}>✕</Text>", '<Ionicons name="close" size={16} color={theme.colors.background} style={{ marginLeft: 4 }} />')
    c = c.replace("<Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: 'bold' }}>✕</Text>", '<Ionicons name="close" size={24} color={theme.colors.text} />')
    c = c.replace("{isSelected && <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' }}>✓</Text>}", '{isSelected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}')
    with open(p, "w") as f: f.write(c)

# 8. SavingsGoalCard
p = "src/components/SavingsGoalCard.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    c = add_import(c)
    c = c.replace("<Text style={styles.icon}>{goal.icon || '🎯'}</Text>", '<Ionicons name={(goal.icon as any) || "flag"} size={28} color={theme.colors.text} style={styles.icon} />')
    c = c.replace("'Goal Reached! 🎉'", "'Goal Reached!'")
    with open(p, "w") as f: f.write(c)

print("Done phase 1")
