import os

p = "src/screens/DashboardScreen.tsx"
with open(p, "r") as f: c = f.read()

# Add missing imports for Glass components
if "import { MoneyDisplay }" not in c:
    c = c.replace("import { SummaryCard }", "import { MoneyDisplay } from '../components/glass/MoneyDisplay';\nimport { GlassCard } from '../components/glass/GlassCard';\nimport { SummaryCard }")

# Update Hero section
old_hero = """        <View style={styles.cardsRow}>
          <SummaryCard title="Total Balance" amount={balance} type="balance" currency={defaultCurrency} />
        </View>"""

new_hero = """        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <GlassCard variant="strong" style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ ...theme.typography.labelCaps, marginBottom: 8 }}>Total Balance</Text>
            <MoneyDisplay amount={balance} currency={defaultCurrency} size="hero" colorType="default" />
          </GlassCard>
        </View>"""

c = c.replace(old_hero, new_hero)

with open(p, "w") as f: f.write(c)
print("Dashboard patched.")
