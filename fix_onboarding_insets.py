import os

p = "src/screens/OnboardingScreen.tsx"
with open(p, "r") as f:
    c = f.read()

# Insert const insets = useSafeAreaInsets(); inside the component
# Let's find "const { completeFirstRun } = useAuth();" and put it after that.
c = c.replace("const { completeFirstRun } = useAuth();", "const { completeFirstRun } = useAuth();\n  const insets = useSafeAreaInsets();")

with open(p, "w") as f:
    f.write(c)
