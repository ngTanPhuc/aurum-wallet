import re
import glob

def fix(path):
    with open(path) as f:
        c = f.read()
    orig = c

    # Fix KeyboardAvoidingView behavior
    c = re.sub(r"behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}", "behavior={Platform.OS === 'ios' ? 'padding' : undefined}", c)
    c = re.sub(r"behavior=\{Platform\.OS === 'ios' \? 'padding' : 'padding'\}", "behavior={Platform.OS === 'ios' ? 'padding' : undefined}", c)

    if c != orig:
        with open(path, 'w') as f:
            f.write(c)

for f in glob.glob('src/**/*.tsx', recursive=True):
    fix(f)
