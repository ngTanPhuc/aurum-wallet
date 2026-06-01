import os

p = "src/components/GlobalFAB.tsx"
with open(p, "r") as f:
    c = f.read()

# Replace action icon colors
c = c.replace('color={theme.colors.background}', 'color={theme.colors.primary}')

# Now for the main FAB, which might have just been replaced.
# Let's fix the main FAB specifically.
# The main FAB line looks like:
# <Ionicons name={isOpen ? "close" : "add"} size={32} color={theme.colors.primary} />
# We want it to be color={isOpen ? theme.colors.primary : theme.colors.background}
c = c.replace('<Ionicons name={isOpen ? "close" : "add"} size={32} color={theme.colors.primary} />', '<Ionicons name={isOpen ? "close" : "add"} size={32} color={isOpen ? theme.colors.primary : theme.colors.background} />')

with open(p, "w") as f:
    f.write(c)

print("FAB colors updated.")
