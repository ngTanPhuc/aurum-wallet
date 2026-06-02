import os

replacements = {
    "src/screens/DashboardScreen.tsx": [
        ('<Ionicons name="warning" size={20} color={theme.colors.warning} />', '<Ionicons name="warning" size={20} color={theme.colors.warning} style={styles.pendingIcon} />'),
    ],
    "src/screens/ReportsScreen.tsx": [
        ('<Ionicons name="flag" size={24} color={theme.colors.primary} />', '<Ionicons name="flag" size={32} color={theme.colors.primary} style={styles.cardIcon} />'),
        ('<Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />', '<Ionicons name="swap-horizontal" size={32} color={theme.colors.primary} style={styles.cardIcon} />'),
        ('<Ionicons name="calendar" size={24} color={theme.colors.primary} />', '<Ionicons name="calendar" size={32} color={theme.colors.primary} style={styles.cardIcon} />'),
        ('<Ionicons name="wallet" size={24} color={theme.colors.primary} />', '<Ionicons name="wallet" size={32} color={theme.colors.primary} style={styles.cardIcon} />'),
        ('<Ionicons name="repeat" size={24} color={theme.colors.primary} />', '<Ionicons name="repeat" size={32} color={theme.colors.primary} style={styles.cardIcon} />'),
        ('<Ionicons name="bar-chart" size={24} color={theme.colors.primary} />', '<Ionicons name="bar-chart" size={32} color={theme.colors.primary} style={styles.cardIcon} />')
    ],
    "src/screens/SavingsGoalDetailScreen.tsx": [
        ('<Ionicons name="trending-up" size={16} color={theme.colors.primary} />', '<Ionicons name="trending-up" size={16} color={theme.colors.primary} style={styles.insightIcon} />')
    ],
    "src/screens/SavingsGoalsScreen.tsx": [
        ('<Ionicons name="flag-outline" size={48} color={theme.colors.textMuted} />', '<Ionicons name="flag-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />')
    ],
    "src/screens/RecurringTransactionsScreen.tsx": [
        ('<Ionicons name={category?.icon as any || (isTransfer ? \'swap-horizontal\' : \'wallet\')} size={24} color={theme.colors.text} />', '<Ionicons name={category?.icon as any || (isTransfer ? \'swap-horizontal\' : \'wallet\')} size={32} color={theme.colors.text} style={styles.icon} />'),
        ('<Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />', '<Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />')
    ],
    "src/screens/PendingRecurringScreen.tsx": [
        ('<Ionicons name={category?.icon as any || (isTransfer ? \'swap-horizontal\' : \'wallet\')} size={24} color={theme.colors.text} />', '<Ionicons name={category?.icon as any || (isTransfer ? \'swap-horizontal\' : \'wallet\')} size={32} color={theme.colors.text} style={styles.icon} />'),
        ('<Ionicons name="sparkles-outline" size={48} color={theme.colors.textMuted} />', '<Ionicons name="sparkles-outline" size={48} color={theme.colors.textMuted} style={styles.emptyIcon} />')
    ]
}

for filepath, reps in replacements.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in reps:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Restored styles and scaled up icons.")
