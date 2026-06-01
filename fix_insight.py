import os

p = "src/components/InsightCard.tsx"
if os.path.exists(p):
    with open(p, "r") as f: c = f.read()
    if "import { Ionicons } from '@expo/vector-icons';" not in c:
        c = c.replace("import React from 'react';", "import React from 'react';\nimport { Ionicons } from '@expo/vector-icons';")
    c = c.replace("<Text style={styles.icon}>{insight.icon}</Text>", '<Ionicons name={insight.icon as any} size={20} color={colors.text} />')
    with open(p, "w") as f: f.write(c)

print("InsightCard updated.")
