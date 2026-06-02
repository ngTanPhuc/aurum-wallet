import os

def patch_summary_card():
    p = "src/components/SummaryCard.tsx"
    with open(p, "r") as f: c = f.read()
    
    if "import { GlassCard }" not in c:
        c = c.replace("import { theme } from '../theme/theme';", "import { theme } from '../theme/theme';\nimport { GlassCard } from './glass/GlassCard';")
    
    c = c.replace("<View style={[styles.card, { backgroundColor: bgColor }]}>", "<GlassCard style={styles.card} variant={type === 'balance' ? 'strong' : 'muted'}>")
    c = c.replace("</View>", "</GlassCard>")
    
    with open(p, "w") as f: f.write(c)

def patch_metric_card():
    p = "src/components/MetricCard.tsx"
    with open(p, "r") as f: c = f.read()
    
    if "import { GlassCard }" not in c:
        c = c.replace("import { theme } from '../theme/theme';", "import { theme } from '../theme/theme';\nimport { GlassCard } from './glass/GlassCard';")
    
    c = c.replace("<View style={styles.card}>", "<GlassCard style={styles.card} variant=\"muted\">")
    c = c.replace("</View>\n    </View>", "</View>\n    </GlassCard>")
    
    with open(p, "w") as f: f.write(c)

patch_summary_card()
patch_metric_card()
print("Cards patched.")
