import os
import re

filepath = 'src/services/__tests__/InsightEngine.test.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("note: \\'\\',", "note: '',")

with open(filepath, 'w') as f:
    f.write(content)
