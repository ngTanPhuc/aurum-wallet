import os

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            p = os.path.join(root, file)
            with open(p, "r") as f: c = f.read()
            original = c
            
            c = c.replace("theme.colors.textPrimaryMuted", "theme.colors.textMuted")
            c = c.replace("theme.colors.textPrimaryDisabled", "theme.colors.textDisabled")
            c = c.replace("theme.colors.textPrimaryPrimary", "theme.colors.textPrimary")
            
            if c != original:
                with open(p, "w") as f: f.write(c)
                print(f"Fixed {p}")
