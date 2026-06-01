import os

p = "src/screens/OnboardingScreen.tsx"
with open(p, "r") as f:
    c = f.read()

if "useSafeAreaInsets" not in c:
    c = c.replace("import { theme }", "import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport { theme }")
    c = c.replace("const handleComplete = () => {", "const insets = useSafeAreaInsets();\n  const handleComplete = () => {")
    c = c.replace("style={[styles.container", "style={[styles.container, { paddingTop: insets.top + 24 }]")
    c = c.replace("style={styles.container}", "style={[styles.container, { paddingTop: insets.top + 24 }]}")

with open(p, "w") as f:
    f.write(c)

print("OnboardingScreen safe area updated.")
