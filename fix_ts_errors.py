import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Simple regex to remove the FIRST occurrence of `color: ...` or `fontWeight: ...` in a line if there's a duplicate? 
    # Actually it's easier to just do simple replacements.
    
    return

