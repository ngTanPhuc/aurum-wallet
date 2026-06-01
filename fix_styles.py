import os
import re
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find { something, ...theme.typography.something }
    # A bit tricky with regex for nested brackets, but we only have simple style objects.
    # Pattern: match an opening `{`, then some characters not containing `{` or `}`, then `...theme.typography.\w+`, then some characters up to `}`.
    
    def repl(m):
        inner = m.group(1)
        # Find all spreads
        spreads = re.findall(r'\.\.\.theme\.typography\.\w+', inner)
        if not spreads:
            return '{' + inner + '}'
        
        # Remove spreads from inner
        new_inner = re.sub(r',\s*\.\.\.theme\.typography\.\w+', '', inner)
        new_inner = re.sub(r'\.\.\.theme\.typography\.\w+\s*,?', '', new_inner)
        
        # Put spreads at the beginning
        prefix = ', '.join(spreads)
        if new_inner.strip():
            prefix += ', '
            
        return '{ ' + prefix + new_inner.strip() + ' }'
        
    new_content = re.sub(r'\{([^{}]*\.\.\.theme\.typography\.\w+[^{}]*)\}', repl, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            fix_file(os.path.join(root, f))
