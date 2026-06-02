import os

replacements = {
    "src/screens/DashboardScreen.tsx": [
        ("<Text style={styles.pendingIcon}>⚠️</Text>", "<Ionicons name=\"warning\" size={20} color={theme.colors.warning} />"),
        ("<Text style={styles.pendingArrow}>➔</Text>", "<Ionicons name=\"arrow-forward\" size={16} color={theme.colors.textMuted} style={{marginHorizontal: 8}} />"),
        ('icon="💰"', 'icon="wallet"'),
        ("icon={cashFlow.isPositive ? '📈' : '📉'}", "icon={cashFlow.isPositive ? 'trending-up' : 'trending-down'}"),
        ('icon="🔥"', 'icon="flame"')
    ],
    "src/screens/ReportsScreen.tsx": [
        ("<Text style={styles.cardIcon}>🎯</Text>", "<Ionicons name=\"flag\" size={24} color={theme.colors.primary} />"),
        ("<Text style={styles.cardIcon}>🔄</Text>", "<Ionicons name=\"swap-horizontal\" size={24} color={theme.colors.primary} />"),
        ("<Text style={styles.cardIcon}>📅</Text>", "<Ionicons name=\"calendar\" size={24} color={theme.colors.primary} />"),
        ("<Text style={styles.cardIcon}>💰</Text>", "<Ionicons name=\"wallet\" size={24} color={theme.colors.primary} />"),
        ("<Text style={styles.cardIcon}>🔁</Text>", "<Ionicons name=\"repeat\" size={24} color={theme.colors.primary} />"),
        ("<Text style={styles.cardIcon}>📊</Text>", "<Ionicons name=\"bar-chart\" size={24} color={theme.colors.primary} />")
    ],
    "src/screens/SavingsGoalDetailScreen.tsx": [
        ("<Text style={styles.insightIcon}>📈</Text>", "<Ionicons name=\"trending-up\" size={16} color={theme.colors.primary} />")
    ],
    "src/screens/SavingsGoalsScreen.tsx": [
        ("<Text style={styles.emptyIcon}>🎯</Text>", "<Ionicons name=\"flag-outline\" size={48} color={theme.colors.textMuted} />")
    ],
    "src/screens/RecurringTransactionsScreen.tsx": [
        ("<Text style={styles.icon}>{category?.icon || (isTransfer ? '🔄' : '💰')}</Text>", "<Ionicons name={category?.icon as any || (isTransfer ? 'swap-horizontal' : 'wallet')} size={24} color={theme.colors.text} />"),
        ("<Text style={styles.emptyIcon}>📅</Text>", "<Ionicons name=\"calendar-outline\" size={48} color={theme.colors.textMuted} />")
    ],
    "src/screens/PendingRecurringScreen.tsx": [
        ("<Text style={styles.icon}>{category?.icon || (isTransfer ? '🔄' : '💰')}</Text>", "<Ionicons name={category?.icon as any || (isTransfer ? 'swap-horizontal' : 'wallet')} size={24} color={theme.colors.text} />"),
        ("<Text style={styles.emptyIcon}>✨</Text>", "<Ionicons name=\"sparkles-outline\" size={48} color={theme.colors.textMuted} />")
    ],
    "src/screens/TemplatesScreen.tsx": [
        ("<Text style={{ fontSize: 20 }}>🗑️</Text>", "<Ionicons name=\"trash\" size={20} color={theme.colors.danger} />"),
        ("<Text style={{ fontSize: 64 }}>📄</Text>", "<Ionicons name=\"document-text-outline\" size={64} color={theme.colors.textMuted} />")
    ],
    "src/screens/TagsScreen.tsx": [
        ("<Text style={{ fontSize: 20 }}>🗑️</Text>", "<Ionicons name=\"trash\" size={20} color={theme.colors.danger} />"),
        ("<Text style={{ fontSize: 64 }}>🏷️</Text>", "<Ionicons name=\"pricetag-outline\" size={64} color={theme.colors.textMuted} />"),
        ("<Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>✕</Text>", "<Ionicons name=\"close\" size={24} color=\"#333\" />")
    ]
}

for filepath, reps in replacements.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # inject Ionicons import if missing and needed
    if "<Ionicons" in str(reps):
        if "import { Ionicons }" not in content:
            # find first import
            first_import_idx = content.find("import ")
            if first_import_idx != -1:
                content = content[:first_import_idx] + "import { Ionicons } from '@expo/vector-icons';\n" + content[first_import_idx:]
    
    for old, new in reps:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replaced emojis with Ionicons in specified screens.")
