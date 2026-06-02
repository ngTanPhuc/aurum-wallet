import os

def find_emojis(d):
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Print any line containing a character > U+2000
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    for char in line:
                        if ord(char) > 0x2000:
                            print(f"{path}:{i+1}: {line.strip()}")
                            break

find_emojis('src')
